export class LoggingService {
  static log(message: string, data?: any) {
    if (__DEV__) {
      console.log(message, data);
    }
    // Add production logging here if needed
  }

  static error(message: string, error: any) {
    if (__DEV__) {
      console.error(message, error);
    }
    // Add error reporting service here if needed
  }

  static warn(message: string, data?: any) {
    if (__DEV__) {
      console.warn(message, data);
    }
    // Add warning logging here if needed
  }

  static info(message: string, data?: any) {
    if (__DEV__) {
      console.info(message, data);
    }
    // Add info logging here if needed
  }
} 