// Mock nodemailer to prevent real emails during tests
jest.mock('nodemailer', () => ({
  createTransport: () => ({
    sendMail: jest.fn().mockResolvedValue({}),
  }),
}));

// Mock Twilio to prevent real SMS during tests
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({ sid: 'mockSid' }),
    },
  }));
}); 