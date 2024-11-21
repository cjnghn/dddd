export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ProcessingError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "ProcessingError";
  }
}
