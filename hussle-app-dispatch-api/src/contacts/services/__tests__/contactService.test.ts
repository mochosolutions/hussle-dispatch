import { NotFoundError } from '@/shared/errors';
import { createContactService } from '../contactService';

const buildContact = () => ({
  id: '22178e81-128e-4ef4-9c17-195a7c835266',
  organizationId: '94df87f4-18bb-41e8-9de6-f2f337251e4e',
  customerId: null,
  role: 'Load Planner',
  firstName: 'Jamie',
  lastName: 'Atlas',
  phone: '555-000-1111',
  email: 'jamie@atlas.test',
  notes: null,
  createdAt: new Date('2026-03-01T00:00:00.000Z'),
  updatedAt: new Date('2026-03-01T00:00:00.000Z'),
  deletedAt: null,
});

describe('contactService', () => {
  const mockContactRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const contactService = createContactService({
    contactRepository: mockContactRepository,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a contact using organization scope', async () => {
    const contact = buildContact();
    mockContactRepository.create.mockResolvedValue(contact);

    const result = await contactService.createContact({
      organizationId: '94df87f4-18bb-41e8-9de6-f2f337251e4e',
      input: {
        firstName: 'Jamie',
        lastName: 'Atlas',
        role: 'Load Planner',
      },
    });

    expect(mockContactRepository.create).toHaveBeenCalledWith(
      '94df87f4-18bb-41e8-9de6-f2f337251e4e',
      expect.objectContaining({
        firstName: 'Jamie',
        lastName: 'Atlas',
        role: 'Load Planner',
      }),
    );
    expect(result.id).toBe('22178e81-128e-4ef4-9c17-195a7c835266');
  });

  it('lists contacts with safe default sort when unknown sort field is provided', async () => {
    const contact = buildContact();
    mockContactRepository.list.mockResolvedValue([contact]);
    mockContactRepository.count.mockResolvedValue(1);

    await contactService.listContacts({
      organizationId: '94df87f4-18bb-41e8-9de6-f2f337251e4e',
      query: { page: '1', limit: '25', sort: 'unknownField', order: 'asc' },
      filters: {},
    });

    expect(mockContactRepository.list).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'asc' },
      }),
    );
  });

  it('updates contact after validating scoped existence', async () => {
    const contact = buildContact();
    mockContactRepository.findById.mockResolvedValue(contact);
    mockContactRepository.update.mockResolvedValue({
      ...contact,
      firstName: 'James',
    });

    const result = await contactService.updateContact({
      id: '22178e81-128e-4ef4-9c17-195a7c835266',
      organizationId: '94df87f4-18bb-41e8-9de6-f2f337251e4e',
      input: {
        firstName: 'James',
      },
    });

    expect(mockContactRepository.findById).toHaveBeenCalledWith(
      '22178e81-128e-4ef4-9c17-195a7c835266',
      '94df87f4-18bb-41e8-9de6-f2f337251e4e',
    );
    expect(result.firstName).toBe('James');
  });

  it('gets contact by id within organization scope', async () => {
    const contact = buildContact();
    mockContactRepository.findById.mockResolvedValue(contact);

    const result = await contactService.getContactById({
      id: '22178e81-128e-4ef4-9c17-195a7c835266',
      organizationId: '94df87f4-18bb-41e8-9de6-f2f337251e4e',
    });

    expect(mockContactRepository.findById).toHaveBeenCalledWith(
      '22178e81-128e-4ef4-9c17-195a7c835266',
      '94df87f4-18bb-41e8-9de6-f2f337251e4e',
    );
    expect(result.id).toBe('22178e81-128e-4ef4-9c17-195a7c835266');
  });

  it('soft deletes an existing scoped contact', async () => {
    const contact = buildContact();
    mockContactRepository.findById.mockResolvedValue(contact);

    await contactService.deleteContact({
      id: '22178e81-128e-4ef4-9c17-195a7c835266',
      organizationId: '94df87f4-18bb-41e8-9de6-f2f337251e4e',
    });

    expect(mockContactRepository.softDelete).toHaveBeenCalledWith(
      '22178e81-128e-4ef4-9c17-195a7c835266',
      expect.any(Date),
    );
  });

  it('throws not found when updating a contact outside org scope', async () => {
    mockContactRepository.findById.mockResolvedValue(null);

    await expect(
      contactService.updateContact({
        id: '22178e81-128e-4ef4-9c17-195a7c835266',
        organizationId: '94df87f4-18bb-41e8-9de6-f2f337251e4e',
        input: {
          firstName: 'James',
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws not found when getting a contact outside org scope', async () => {
    mockContactRepository.findById.mockResolvedValue(null);

    await expect(
      contactService.getContactById({
        id: '22178e81-128e-4ef4-9c17-195a7c835266',
        organizationId: '94df87f4-18bb-41e8-9de6-f2f337251e4e',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
