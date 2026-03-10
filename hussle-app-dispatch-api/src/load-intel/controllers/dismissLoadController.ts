import type { Request, Response } from 'express';
import { dismissLoadMapper } from './mappers/dismissLoadMapper';

interface DismissLoadControllerDeps {
  dismissLoad: (orgId: string, loadHash: string) => Promise<void>;
}

export const dismissLoadController = (deps: DismissLoadControllerDeps) =>
  async (req: Request, res: Response) => {
    const { orgId, loadHash } = dismissLoadMapper(req);
    await deps.dismissLoad(orgId, loadHash);

    res.status(204).send();
  };
