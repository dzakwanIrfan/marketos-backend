import { createParamDecorator, ExecutionContext } from "@nestjs/common";

const getCuttentUserByContext = (context: ExecutionContext) => {
    return context.switchToHttp().getRequest().user;
};

export const CurrentUser = createParamDecorator(
    (_data: unknown, context: ExecutionContext) => getCuttentUserByContext(context)
);