// app/utils/path.ts

export const path = {
  to: {
    backOffice: () => "/back-office",
    actionCall: (id: number) => `/action-calls/${id}`,
    // Add more routes as needed
  },
} as const;
