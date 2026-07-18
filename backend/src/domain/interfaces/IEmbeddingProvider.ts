export interface IEmbeddingProvider {
  embed(text: string): Promise<number[]>;
  readonly modelName: string;
}
