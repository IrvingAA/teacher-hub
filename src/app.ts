import express, { Application, NextFunction, Request, Response } from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { getOpenApiDocument } from './docs/swagger';
import { renderLandingPage } from './routes/system/system.views';
import {
  createCorsMiddleware,
  createHelmetMiddleware,
  sanitizeRequestPayload,
} from './middlewares/security';

import passport from './config/passport';
import { setupPassport } from './config/passport';
import { attachRequestContext } from './middlewares/context';
import { captureRequestTelemetry } from './middlewares/events';
import { responseTimeMiddleware } from './middlewares/responseTime';

import { env } from './config/env';

const app: Application = express();
const isProduction = env.NODE_ENV === 'production';
const openApiDocument = isProduction ? getOpenApiDocument() : null;

setupPassport();
app.use(passport.initialize());
app.use(createCorsMiddleware());
app.use(createHelmetMiddleware());

app.use(responseTimeMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(process.cwd(), 'public', 'assets')));
app.use(sanitizeRequestPayload);

app.use(attachRequestContext);
app.use(captureRequestTelemetry);

app.get('/openapi.json', (req, res) => {
  try {
    const document = getOpenApiDocument();
    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate OpenAPI document' });
  }
});

app.get('/', (req, res) => {
  res.status(200).type('html').send(renderLandingPage());
});

app.use('/docs', swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = getOpenApiDocument();
    return swaggerUi.setup(document, {
      explorer: true,
      customSiteTitle: 'TeacherHub API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
      },
    })(req, res, next);
  } catch (error) {
    next(error);
  }
});

app.use('/', routes);

app.use(errorHandler);

export default app;
