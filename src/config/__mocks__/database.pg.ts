export const AppDataSource = {
  isInitialized: true,
  initialize: jest.fn().mockResolvedValue(undefined),
};

export async function connectPostgres(): Promise<void> {
  return Promise.resolve();
}
