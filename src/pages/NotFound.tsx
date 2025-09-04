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
      undefined,
      { path: location.pathname }
    );
  }, [location.pathname, logger]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <Heading variant="h1" className="mb-md">
          404
        </Heading>
        <Text className="mb-md text-h4 text-gray-600">
          Oops! Page not found
        </Text>
        <a href="/" className="text-blue-500 underline hover:text-blue-700">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;

