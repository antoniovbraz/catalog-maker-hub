import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Heading, Text } from "@/components/ui/typography";
import { useLogger } from "@/utils/logger";

const NotFound = () => {
  const location = useLocation();
  const logger = useLogger('NotFound');

  useEffect(() => {
    logger.error(
      'User attempted to access non-existent route',
      { path: location.pathname }
    );
  }, [location.pathname, logger]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="text-center">
        <Heading variant="h1" className="mb-md">
          404
        </Heading>
        <Text className="text-muted-foreground text-h4 mb-md">
          Oops! Page not found
        </Text>
        <a href="/" className="text-primary hover:text-primary/80 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;

