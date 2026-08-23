import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => {
  const mockStripeCustomers = {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const mockStripeCheckout = { create: vi.fn() };
  const mockStripePortal = { create: vi.fn() };
  const StripeMock = vi.fn(function (this: any) {
    this.customers = mockStripeCustomers;
    this.checkout = { sessions: mockStripeCheckout };
    this.billingPortal = { sessions: mockStripePortal };
  });
  const mockSupabaseAuth = { getUser: vi.fn() };
  const mockSupabaseFrom = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  };
  const createClientMock = vi.fn().mockImplementation(() => ({
    auth: mockSupabaseAuth,
    from: () => mockSupabaseFrom,
  }));
  return {
    StripeMock,
    mockStripeCustomers,
    mockStripeCheckout,
    mockStripePortal,
    mockSupabaseAuth,
    mockSupabaseFrom,
    createClientMock,
  };
});

vi.mock("stripe", () => ({ default: h.StripeMock }));
vi.mock("@supabase/supabase-js", () => ({ createClient: h.createClientMock }));

const {
  mockStripeCustomers,
  mockStripeCheckout,
  mockStripePortal,
  mockSupabaseAuth,
  mockSupabaseFrom,
} = h;

process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.STRIPE_PRICE_ID = "price_yearly";
process.env.STRIPE_PRICE_ID_MONTHLY = "price_monthly";
process.env.SUPABASE_URL = "https://mock.supabase.co";
process.env.SUPABASE_ANON_KEY = "anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";

function makeRes() {
  const res: any = {
    statusCode: 0,
    body: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: any) {
      res.body = body;
      return res;
    },
  };
  return res;
}

function makeReq(overrides: Partial<any> = {}) {
  return {
    method: "POST",
    headers: {} as Record<string, string>,
    body: {},
    ...overrides,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/checkout", () => {
  it("405 on GET", async () => {
    const { default: handler } = await import("../api/checkout");
    const res = makeRes();
    await handler(makeReq({ method: "GET" }), res);
    expect(res.statusCode).toBe(405);
  });

  it("401 without Authorization header", async () => {
    const { default: handler } = await import("../api/checkout");
    const res = makeRes();
    await handler(makeReq(), res);
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/unauthorized/i);
  });

  it("401 with invalid token", async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "bad jwt" },
    });
    const { default: handler } = await import("../api/checkout");
    const res = makeRes();
    await handler(
      makeReq({ headers: { authorization: "Bearer invalid" } }),
      res,
    );
    expect(res.statusCode).toBe(401);
  });

  it("creates checkout session for a valid user", async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "a@b.c" } },
      error: null,
    });
    mockStripeCustomers.list.mockResolvedValue({ data: [] });
    mockStripeCustomers.create.mockResolvedValue({
      id: "cus_1",
      metadata: {},
    });
    mockStripeCheckout.create.mockResolvedValue({ url: "https://stripe/checkout" });

    const { default: handler } = await import("../api/checkout");
    const res = makeRes();
    await handler(
      makeReq({ headers: { authorization: "Bearer good" }, body: { interval: "year" } }),
      res,
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.url).toBe("https://stripe/checkout");
    // customer created with the verified email, not a body-supplied one
    expect(mockStripeCustomers.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: "a@b.c" }),
    );
    // yearly price by default
    expect(mockStripeCheckout.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: "price_yearly", quantity: 1 }],
      }),
    );
  });

  it("uses monthly price when interval=month", async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "a@b.c" } },
      error: null,
    });
    mockStripeCustomers.list.mockResolvedValue({
      data: [{ id: "cus_1", metadata: { supabase_user_id: "u1" } }],
    });
    mockStripeCheckout.create.mockResolvedValue({ url: "https://stripe/checkout" });

    const { default: handler } = await import("../api/checkout");
    const res = makeRes();
    await handler(
      makeReq({ headers: { authorization: "Bearer good" }, body: { interval: "month" } }),
      res,
    );
    expect(mockStripeCheckout.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: "price_monthly", quantity: 1 }],
      }),
    );
  });

  it("429 when rate limit exceeded", async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: "u_rate", email: "r@b.c" } },
      error: null,
    });
    mockStripeCustomers.list.mockResolvedValue({
      data: [{ id: "cus_1", metadata: { supabase_user_id: "u_rate" } }],
    });
    mockStripeCheckout.create.mockResolvedValue({ url: "https://stripe/checkout" });

    const { default: handler } = await import("../api/checkout");
    for (let i = 0; i < 5; i++) {
      const res = makeRes();
      await handler(makeReq({ headers: { authorization: "Bearer good" } }), res);
      expect(res.statusCode).toBe(200);
    }
    const res6 = makeRes();
    await handler(makeReq({ headers: { authorization: "Bearer good" } }), res6);
    expect(res6.statusCode).toBe(429);
  });
});

describe("POST /api/portal", () => {
  it("405 on GET", async () => {
    const { default: handler } = await import("../api/portal");
    const res = makeRes();
    await handler(makeReq({ method: "GET" }), res);
    expect(res.statusCode).toBe(405);
  });

  it("401 without auth", async () => {
    const { default: handler } = await import("../api/portal");
    const res = makeRes();
    await handler(makeReq(), res);
    expect(res.statusCode).toBe(401);
  });

  it("404 when user has no stripe customer", async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: "u2", email: "p@b.c" } },
      error: null,
    });
    mockSupabaseFrom.maybeSingle.mockResolvedValue({
      data: { stripe_customer_id: null },
    });

    const { default: handler } = await import("../api/portal");
    const res = makeRes();
    await handler(
      makeReq({ headers: { authorization: "Bearer good" } }),
      res,
    );
    expect(res.statusCode).toBe(404);
  });

  it("resolves customer from DB, never from body", async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: "u2", email: "p@b.c" } },
      error: null,
    });
    mockSupabaseFrom.maybeSingle.mockResolvedValue({
      data: { stripe_customer_id: "cus_from_db" },
    });
    mockStripePortal.create.mockResolvedValue({ url: "https://stripe/portal" });

    const { default: handler } = await import("../api/portal");
    const res = makeRes();
    await handler(
      makeReq({
        headers: { authorization: "Bearer good" },
        body: { customer_id: "cus_attacker" },
      }),
      res,
    );
    expect(res.statusCode).toBe(200);
    // The attacker-supplied customer_id must be ignored
    expect(mockStripePortal.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_from_db" }),
    );
  });
});
