import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { TErrorSources } from '../interface/error';
import handleZodError from '../error/handleZodError';
import handleValidationError from '../error/handleValidationError';
import handleCastError from '../error/handleCastError';
import handleDuplicateError from '../error/handleDuplicateKeyError';
import AppError from '../error/AppError';
import config from '../config';

const setErrorDetails = (simplifiedError: {
  statusCode: number;
  message: string;
  errorSources: TErrorSources;
}) => {
  return {
    statusCode: simplifiedError.statusCode,
    message: simplifiedError.message,
    errorSources: simplifiedError.errorSources,
  };
};

// 14-2,3


  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
export const globalErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  next,
) => {
  // setting default values
  let statusCode = 500;
  let message = 'An unexpected error occurred';

  let errorSources: TErrorSources = [
    {
      path: '',
      message: 'Something went wrong',
    },
  ];

  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    ({ statusCode, message, errorSources } = setErrorDetails(simplifiedError));
  } else if (err?.name === 'ValidationError') {
    // Mongoose validation error
    const simplifiedError = handleValidationError(err);
    ({ statusCode, message, errorSources } = setErrorDetails(simplifiedError));
  } else if (err?.name === 'CastError') {
    // Mongoose cast error
    const simplifiedError = handleCastError(err);
    ({ statusCode, message, errorSources } = setErrorDetails(simplifiedError));
  } else if (err?.code === 11000) {
    // duplicate key error mongoose
    const simplifiedError = handleDuplicateError(err);
    ({ statusCode, message, errorSources } = setErrorDetails(simplifiedError));
  } else if (err instanceof AppError) {
    // APPError handle custom
    statusCode = err?.statusCode;
    message = err?.message;
    errorSources = [
      {
        path: '',
        message: err.message,
      },
    ];
  } else if (err instanceof Error) {
    //default error pattern
    message = err?.message;
    errorSources = [
      {
        path: '',
        message: err.message,
      },
    ];
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    // error: err,
    stack: config.NODE_ENV === 'production' ? null : err.stack,
  });
};