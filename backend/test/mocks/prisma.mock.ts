export type PrismaMock = {
    admin: { findUnique: jest.Mock; create: jest.Mock };
    usuarioCozinha: { findUnique: jest.Mock };
    restaurante: { findUnique: jest.Mock; findFirst: jest.Mock; create: jest.Mock; upsert: jest.Mock };
    categoria: { findMany: jest.Mock; create: jest.Mock };
    produto: { findMany: jest.Mock; create: jest.Mock; findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock };
    mesa: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock; createMany: jest.Mock; deleteMany: jest.Mock; count: jest.Mock };
    pedido: { findMany: jest.Mock; create: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
};

export function criarPrismaMock(): PrismaMock {
    return {
        admin: { findUnique: jest.fn(), create: jest.fn() },
        usuarioCozinha: { findUnique: jest.fn() },
        restaurante: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), upsert: jest.fn() },
        categoria: { findMany: jest.fn(), create: jest.fn() },
        produto: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
        mesa: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), createMany: jest.fn(), deleteMany: jest.fn(), count: jest.fn() },
        pedido: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    };
}
