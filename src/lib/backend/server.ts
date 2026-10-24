import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AuthContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
  claims: Record<string, unknown>;
};

export type RpcMethod = "GET" | "POST";
export type RpcCallOptions<Data> = { data: Data };
export type RpcArguments<Data> = [Data] extends [undefined]
  ? [options?: { data?: Data }]
  : [options: RpcCallOptions<Data>];
export type RpcFunction<Data, Result> = ((...args: RpcArguments<Data>) => Promise<Result>) & {
  method: RpcMethod;
};
type Middleware = () => Promise<AuthContext>;

/** Retains the existing validation/authorization chain behind Next route handlers. */
class ServerFunctionBuilder<Input = undefined, Data = Input> {
  constructor(
    private readonly method: RpcMethod,
    private readonly middlewares: Middleware[] = [],
    private readonly validate?: (input: unknown) => Data,
  ) {}

  middleware(middlewares: Middleware[]): ServerFunctionBuilder<Input, Data> {
    return new ServerFunctionBuilder(
      this.method,
      [...this.middlewares, ...middlewares],
      this.validate,
    );
  }

  inputValidator<RawInput, Output>(
    validate: (input: RawInput) => Output,
  ): ServerFunctionBuilder<RawInput, Output> {
    return new ServerFunctionBuilder(this.method, this.middlewares, (input) =>
      validate(input as RawInput),
    );
  }

  handler<Result>(
    handler: (args: { data: Data; context: AuthContext }) => Promise<Result>,
  ): RpcFunction<Input, Result> {
    const execute = async (...args: RpcArguments<Input>) => {
      let context = {} as AuthContext;
      for (const middleware of this.middlewares) context = { ...context, ...(await middleware()) };
      const input = args[0]?.data;
      const data = this.validate ? this.validate(input) : (input as unknown as Data);
      return handler({ data, context });
    };
    return Object.assign(execute, { method: this.method });
  }
}

export function createServerFn(options: { method: RpcMethod }): ServerFunctionBuilder {
  return new ServerFunctionBuilder(options.method);
}
