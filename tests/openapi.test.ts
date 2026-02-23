import { getOpenApiDocument } from '../src/docs/swagger';

describe('OpenAPI consistency', () => {
  it('includes users, teachers, schools, events and security paths with core schemas', () => {
    const doc = getOpenApiDocument() as any;

    expect(doc.paths['/api/users']).toBeDefined();
    expect(doc.paths['/api/teachers']).toBeDefined();
    expect(doc.paths['/api/schools']).toBeDefined();
    expect(doc.paths['/api/events']).toBeDefined();
    expect(doc.paths['/api/security/api-keys']).toBeDefined();

    expect(doc.components.schemas.LoginStandardResponse).toBeDefined();
    expect(doc.components.schemas.UserStandardResponse).toBeDefined();
    expect(doc.components.schemas.TeacherStandardResponse).toBeDefined();
    expect(doc.components.schemas.SchoolStandardResponse).toBeDefined();
    expect(doc.components.schemas.EventsListStandardResponse).toBeDefined();
    expect(doc.components.schemas.ApiKeyCreateStandardResponse).toBeDefined();
    expect(doc.components.securitySchemes.apiKeyAuth).toBeDefined();
    expect(doc.paths['/api/teachers'].get.security).toEqual([{ bearerAuth: [], apiKeyAuth: [] }]);
  });
});
