export const validators = {
    email: (email) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email) || 'Please enter a valid email address';
    },
  
    phone: (phone) => {
      const re = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      return re.test(phone) || 'Please enter a valid phone number';
    },
  
    required: (value) => {
      return (value && value.toString().trim().length > 0) || 'This field is required';
    },
  
    minLength: (min) => (value) => {
      return (value && value.length >= min) || `Must be at least ${min} characters`;
    },
  
    maxLength: (max) => (value) => {
      return (value && value.length <= max) || `Must be no more than ${max} characters`;
    },
  
    number: (value) => {
      return !isNaN(value) || 'Must be a number';
    },
  
    positive: (value) => {
      return value > 0 || 'Must be a positive number';
    },
  
    url: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return 'Please enter a valid URL';
      }
    },
  };
  
  export const validate = (value, rules) => {
    for (const rule of rules) {
      const result = typeof rule === 'function' ? rule(value) : rule;
      if (result !== true) {
        return result;
      }
    }
    return true;
  };
  
  // Usage example:
  // const emailError = validate(email, [validators.required, validators.email]);