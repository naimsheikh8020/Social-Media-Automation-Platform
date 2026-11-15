// utils/response.ts
import type { Response } from "express";

interface SuccessBody<T> {
  success: true;
  status: "success";
  message?: string;
  data: T;
  timestamp: string;
}

export const ok = <T>(res: Response, data: T, message?: string): Response => {
  const body: SuccessBody<T> = {
    success: true,
    status: "success",
    data,
    timestamp: new Date().toISOString(),
    ...(message ? { message } : {}),
  };
  return res.status(200).json(body);
};

export const created = <T>(res: Response, data: T, message?: string): Response => {
  const body: SuccessBody<T> = {
    success: true,
    status: "success",
    data,
    timestamp: new Date().toISOString(),
    ...(message ? { message } : {}),
  };
  return res.status(201).json(body);
};