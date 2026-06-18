type MockRecord = Record<string, unknown>;

function createRecord(data?: MockRecord) {
  return {
    id: "telegram-local-id",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...(data ?? {})
  };
}

function createModelMock() {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop !== "string") {
          return undefined;
        }

        if (prop === "findMany") return async () => [];
        if (prop === "findFirst") return async () => null;
        if (prop === "findUnique") return async () => null;
        if (prop === "count") return async () => 0;
        if (prop === "deleteMany") return async () => ({ count: 0 });
        if (prop === "updateMany") return async () => ({ count: 0 });
        if (prop === "createMany") return async () => ({ count: 0 });
        if (prop === "delete") return async () => null;

        if (prop === "create") {
          return async (args?: { data?: MockRecord }) => createRecord(args?.data);
        }

        if (prop === "update") {
          return async (args?: { data?: MockRecord }) => createRecord(args?.data);
        }

        if (prop === "upsert") {
          return async (args?: { create?: MockRecord; update?: MockRecord }) =>
            createRecord(args?.update ?? args?.create);
        }

        return async () => null;
      }
    }
  );
}

function createPrismaMock() {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "$transaction") {
          return async (input: unknown) => {
            if (typeof input === "function") {
              return input(prisma);
            }

            if (Array.isArray(input)) {
              return Promise.all(input);
            }

            return input;
          };
        }

        if (prop === "$connect" || prop === "$disconnect") {
          return async () => undefined;
        }

        return createModelMock();
      }
    }
  );
}

export const prisma = createPrismaMock() as any;
