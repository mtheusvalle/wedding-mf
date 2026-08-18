-- AlterTable
ALTER TABLE "WeddingConfig" ADD COLUMN     "pixKey" TEXT NOT NULL DEFAULT 'seu-pix@email.com',
ADD COLUMN     "pixQrCode" TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=400';
