import { Router, Request, Response } from 'express';
import { buildHealthResponse, getRequestedFormat } from './system.schemas';
import { renderHealthPage, renderLandingPage } from './system.views';
import { throttleService } from '../../cache/throttle.service';
import { sendApiResponse } from '../_shared/response.utils';

const systemRoutes = Router();

systemRoutes.get('/', (_req: Request, res: Response) => {
  res.status(200).type('html').send(renderLandingPage());
});

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - System
 *     summary: Get service health status
 *     description: Returns runtime status for PostgreSQL and Redis.
 *     responses:
 *       200:
 *         description: Health payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
systemRoutes.get('/health', (req: Request, res: Response) => {
  const response = buildHealthResponse();
  const format = getRequestedFormat(req);
  const accept = req.get('accept') ?? '';
  const wantsHtml = format === 'html' || (!format && accept.includes('text/html'));

  if (format === 'json' || !wantsHtml) {
    res.status(200).json(response);
    return;
  }

  res.status(200).type('html').send(renderHealthPage(response));
});

/**
 * @openapi
 * /system/throttles:
 *   delete:
 *     tags:
 *       - System
 *     summary: Clear all throttles
 *     responses:
 *       200:
 *         description: All throttles cleared
 */
systemRoutes.delete('/system/throttles', async (req: Request, res: Response) => {
  await throttleService.clearAll();
  sendApiResponse(res, {
    statusCode: 200,
    title: 'Correcto',
    message: 'Todos los throttles han sido eliminados.',
  });
});

/**
 * @openapi
 * /system/throttles/{key}:
 *   get:
 *     tags:
 *       - System
 *     summary: Get status of a specific throttle key
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Throttle status
 */
systemRoutes.get('/system/throttles/:key', async (req: Request, res: Response) => {
  const status = await throttleService.getStatus(String(req.params.key));
  sendApiResponse(res, {
    statusCode: 200,
    title: 'Correcto',
    message: 'Estatus del throttle consultado.',
    data: status,
  });
});

/**
 * @openapi
 * /system/throttles/{key}:
 *   delete:
 *     tags:
 *       - System
 *     summary: Clear a specific throttle key
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Throttle cleared
 */
systemRoutes.delete('/system/throttles/:key', async (req: Request, res: Response) => {
  await throttleService.clear(String(req.params.key));
  sendApiResponse(res, {
    statusCode: 200,
    title: 'Correcto',
    message: `Throttle ${req.params.key} eliminado correctamente.`,
  });
});

export default systemRoutes;
