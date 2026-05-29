-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_dispatcherUserId_fkey" FOREIGN KEY ("dispatcherUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
