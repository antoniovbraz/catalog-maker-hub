import { RequestContext } from '../../../packages/types/mercado-livre';
import { NextFunction, Request, Response } from '../shared/adapter';

export async function requestContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const tenantId = res.locals.tenantId;
  const userId = res.locals.userId;

  res.locals.context = {
    requestId,
    tenantId,
    userId,
    timestamp: new Date()
  } as RequestContext;

  res.headers.set('x-request-id', requestId);
  await next();
}
