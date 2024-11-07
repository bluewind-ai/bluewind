// app/lib/errors.ts

export class RequireApprovalError extends Error {
  constructor() {
    super("This action requires approval");
  }
}
