import { getPool, sql } from "../db/pool";
import { logger } from "../utils/logger";

export const writeAudit = async (params: {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> => {
  try {
    const pool = await getPool();
    await pool
      .request()
      .input("actor", sql.NVarChar(36), params.actorUserId ?? null)
      .input("action", sql.NVarChar(100), params.action)
      .input("entityType", sql.NVarChar(50), params.entityType)
      .input("entityId", sql.NVarChar(100), params.entityId)
      .input(
        "payload",
        sql.NVarChar(sql.MAX),
        params.payload ? JSON.stringify(params.payload) : null
      )
      .input("ip", sql.NVarChar(64), params.ipAddress ?? null)
      .input("ua", sql.NVarChar(500), params.userAgent ?? null)
      .query(`
        INSERT INTO dbo.AuditLogs (ActorUserId, Action, EntityType, EntityId, Payload, IpAddress, UserAgent)
        VALUES (@actor, @action, @entityType, @entityId, @payload, @ip, @ua)
      `);
  } catch (err) {
    // Audit log failure should never break the application
    logger.error({ err }, "Lỗi ghi audit log");
  }
};
