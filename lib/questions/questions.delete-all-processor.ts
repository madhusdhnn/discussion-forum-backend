import { Context, SQSEvent } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IAnswer } from "../models/Answer";
import { IChannel } from "../models/Channel";
import { NotFoundError } from "../models/Errors";
import { IQuestion } from "../models/Question";
import { chunkArray } from "../utils";

const ddb = new DocumentClient();

exports.handler = async (event: SQSEvent, context: Context): Promise<void> => {
  try {
    const message = event.Records[0];
    const channelId = JSON.parse(message.body) as string;
    const getChannelResult = await ddb
      .get({
        TableName: process.env.CHANNELS_TABLE_NAME as string,
        Key: { channelId },
      })
      .promise();

    const channel = getChannelResult.Item as IChannel;

    if (!channel) {
      throw new NotFoundError(`No channel found: (Channel ID: ${channelId})`);
    }

    if (channel.totalQuestions === 0) {
      console.log("No questions found. Deletion skipped..");
      return;
    }

    console.log(`Retrive questions for channel: ${channelId}`);
    const questions = await getQuestions(channelId);

    if (questions.length > 0) {
      const questionsChunked = chunkArray<IQuestion>(questions, 25);
      await Promise.all(
        questionsChunked.map(async (chunk) => {
          await Promise.all(
            chunk.map(async (question) => {
              console.log(`Retrive answers for question: ${question.questionId}`);
              const answers = await getAnswers(question.questionId);
              if (answers.length > 0) {
                console.log(`[START] Delete answers for question: ${question.questionId}`);
                await deleteAnswers(answers);
                console.log(`[END] Delete answers for question: ${question.questionId}`);
              }
            })
          );
          console.log(`[START] Delete questions in channel: ${channelId}`);
          await deleteQuestions(chunk);
          console.log(`[END] Delete questions in channel: ${channelId}`);
        })
      );

      console.log(`Questions deleted successfully. Total questions: ${channel.totalQuestions}`);

      await ddb
        .update({
          TableName: process.env.CHANNELS_TABLE_NAME as string,
          Key: { channelId },
          UpdateExpression: "SET totalQuestions = :value, updatedAt = :updatedAt",
          ExpressionAttributeValues: {
            ":value": 0,
            ":updatedAt": new Date().getTime(),
          },
        })
        .promise();
    }
  } catch (e: any) {
    console.error("Failed to delete questions", e);
  }
};

const getAnswers = async (questionId: string) => {
  const answersResult = await ddb
    .query({
      TableName: process.env.ANSWERS_TABLE_NAME as string,
      KeyConditionExpression: "questionId = :questionId",
      ExpressionAttributeValues: {
        ":questionId": questionId,
      },
    })
    .promise();

  const answers = (answersResult.Items || []) as IAnswer[];
  return answers;
};

const getQuestions = async (channelId: string) => {
  const questionsResult = await ddb
    .query({
      TableName: process.env.QUESTIONS_TABLE_NAME as string,
      KeyConditionExpression: "channelId = :channelId",
      ExpressionAttributeValues: {
        ":channelId": channelId,
      },
    })
    .promise();

  const questions = (questionsResult.Items || []) as IQuestion[];
  return questions;
};

const deleteQuestions = async (chunk: IQuestion[]) => {
  const questionsDeleteRequests = chunk.map((question) => ({
    DeleteRequest: {
      Key: { channelId: question.channelId, questionId: question.questionId },
    },
  }));

  await ddb
    .batchWrite({
      RequestItems: {
        [process.env.QUESTIONS_TABLE_NAME as string]: questionsDeleteRequests,
      },
    })
    .promise();
};

const deleteAnswers = async (answers: IAnswer[]) => {
  const answersChunked = chunkArray<IAnswer>(answers, 25);
  const answersDeleteRequestBatched = answersChunked.map(async (chunk) => {
    const answersDeleteRequests = chunk.map((answer) => ({
      DeleteRequest: {
        Key: { questionId: answer.questionId, answerId: answer.answerId },
      },
    }));

    await ddb
      .batchWrite({
        RequestItems: {
          [process.env.ANSWERS_TABLE_NAME as string]: answersDeleteRequests,
        },
      })
      .promise();
  });

  await Promise.all(answersDeleteRequestBatched);
};
