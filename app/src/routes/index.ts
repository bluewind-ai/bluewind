'use strict';

export default async function (fastify): Promise<void> {
  fastify.post('/test_runs', async (_, reply) => {
    reply.type('application/json').code(200);
    return { hello: 'world' };
  });
}
