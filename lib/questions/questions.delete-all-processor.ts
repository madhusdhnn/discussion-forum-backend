import { Context, SQSEvent } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { IAnswer } from "../models/Answer";
import { IChannel } from "../models/Channel";
import { IQuestion } from "../models/Question";
import { chunkArray } from "../utils";

const ddb = new DocumentClient();

exports.handler = async (event: SQSEvent, context: Context): Promise<void> => {
  try {
    const message = event.Records[0];
    const channel = JSON.parse(message.body) as IChannel;

    if (channel.totalQuestions === 0) {
      console.log("No questions found. Deletion skipped..");
      return;
    }

    const questions = await getQuestions(channel.channelId);

    if (questions.length > 0) {
      const questionsChunked = chunkArray<IQuestion>(questions, 25);
      await Promise.all(
        questionsChunked.map(async (chunk) => {
          await Promise.all(
            chunk.map(async (question) => {
              const answers = await getAnswers(question.questionId);
              if (answers.length > 0) {
                await deleteAnswers(answers);
              }
            })
          );
          await deleteQuestions(chunk);
        })
      );

      console.log(`Questions deleted successfully. Total questions: ${channel.totalQuestions}`);

      await ddb
        .update({
          TableName: process.env.CHANNELS_TABLE_NAME as string,
          Key: { channelId: channel.channelId },
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
