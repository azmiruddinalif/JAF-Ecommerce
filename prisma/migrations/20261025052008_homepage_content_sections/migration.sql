-- AlterTable
ALTER TABLE "StoreSetting" ADD COLUMN     "brandStatementBody" TEXT NOT NULL DEFAULT 'JAF was built for fans who treat the jersey as more than merchandise. It is identity. We obsess over fit, fabric and finish so that every release feels as premium off the pitch as the clubs we celebrate feel on it. Football is our language — fashion is how we speak it.',
ADD COLUMN     "brandStatementHeading" TEXT NOT NULL DEFAULT 'WE ARE THE ION TO FASHION',
ADD COLUMN     "editorialBody" TEXT NOT NULL DEFAULT 'Every JAF jersey is built on the same tension that drives the game — discipline and flair, heritage and rebellion. Wear it on matchday. Wear it every day.',
ADD COLUMN     "editorialCtaLabel" TEXT NOT NULL DEFAULT 'DISCOVER THE EDIT',
ADD COLUMN     "editorialEyebrow" TEXT NOT NULL DEFAULT 'The Edit',
ADD COLUMN     "editorialHeading" TEXT NOT NULL DEFAULT 'CULTURE ON THE PITCH & THE STREET',
ADD COLUMN     "editorialImagePublicId" TEXT,
ADD COLUMN     "editorialImageUrl" TEXT,
ADD COLUMN     "finalCtaButtonLabel" TEXT NOT NULL DEFAULT 'SHOP NOW',
ADD COLUMN     "finalCtaHeadingLine1" TEXT NOT NULL DEFAULT 'FIND YOUR JERSEY.',
ADD COLUMN     "finalCtaHeadingLine2" TEXT NOT NULL DEFAULT 'WEAR YOUR GAME.',
ADD COLUMN     "finalCtaImagePublicId" TEXT,
ADD COLUMN     "finalCtaImageUrl" TEXT;
