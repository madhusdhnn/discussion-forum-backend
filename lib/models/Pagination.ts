export interface IPagination {
  count: number;
  total: number;
  nextEvaluationKey?: string;
}

export interface IPagedResponse<T> {
  data: T[];
  pagination: IPagination;
}
