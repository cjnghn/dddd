// src/domain/flight/repositories/flight.ts
import type { PrismaClient } from "@prisma/client";
import { logger } from "../../../config/logger";

export class FlightRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    name: string;
    date: Date;
    description?: string;
    logPath?: string;
  }) {
    logger.debug("Creating new flight record", { name: data.name });
    return this.prisma.flight.create({
      data: {
        name: data.name,
        date: data.date,
        description: data.description ?? "",
        flightLog: data.logPath ?? "",
      },
    });
  }

  async findById(id: number) {
    return this.prisma.flight.findUnique({
      where: { id },
      include: {
        videos: true,
        telemetry: true,
      },
    });
  }

  async update(
    id: number,
    data: Partial<{
      name: string;
      description: string;
      logPath: string;
    }>
  ) {
    return this.prisma.flight.update({
      where: { id },
      data,
    });
  }
}
