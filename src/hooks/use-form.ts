"use client";

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AnyObject, ObjectSchema } from "yup";
import { ValidationError } from "yup";

interface IHelper<T> {
  setValues: Dispatch<SetStateAction<T>>;
  setErrors: Dispatch<SetStateAction<Partial<Record<keyof T, string>>>>;
}
interface IUseForm<T extends Record<string, any>> {
  initial: T;
  schema?: ObjectSchema<AnyObject>;
  onSubmit: (p: T, helpers?: IHelper<T>) => void;
}

export default function useForm<T extends Record<string, any>>({
  initial,
  schema,
  onSubmit,
}: IUseForm<T>) {
  const [values, setValues] = useState<typeof initial>(initial);
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof initial, string>>
  >({});
  const [isValid, setIsValid] = useState(false);
  const [touchedFields, setTouchedfields] = useState<string[]>([]);

  const validation = useMemo(() => schema, [schema]);

  const handleSetError = (err: ValidationError, show = false) => {
    const validationErrors: Partial<Record<keyof typeof initial, string>> = {};
    err.inner.forEach((error) => {
      if (error.path && (show || touchedFields.includes(error.path))) {
        validationErrors[error.path as keyof typeof initial] = error.message;
      }
    });
    setErrors(validationErrors);
  };

  const validateForm = useCallback(async () => {
    if (!validation) return;
    try {
      await validation.validate(values, { abortEarly: false });
      setErrors({});
      setIsValid(true);
    } catch (err) {
      if (err instanceof ValidationError) {
        handleSetError(err);
        setIsValid(false);
      }
    }
  }, [values, touchedFields, validation]);

  const handleValue = (name: string, value: any) => {
    if (!touchedFields.includes(name)) {
      setTouchedfields((p) => [...p, name]);
    }
    console.log(`Value changed for ${name}: ${value}`);
    setValues((p: any) => ({ ...p, [name]: value }));
  };

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, type, checked, value } = e.target;
    const val = type === "checkbox" ? checked : value;
    handleValue(name, val);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      let payload = values;
      if (validation) {
        payload = (await validation.validate(values, {
          abortEarly: false,
        })) as T;
      }
      await onSubmit(payload, { setValues, setErrors });

      setErrors({});
    } catch (err) {
      if (err instanceof ValidationError) {
        handleSetError(err, true);
      }
    }
  };

  const getField = (name: keyof typeof initial) => {
    return {
      name,
      value: values[name],
      error: errors[name],
      onChange: handleChange,
    };
  };

  useEffect(() => {
    validateForm();
  }, [values, validateForm]);

  return {
    handleValue,
    values,
    setValues,
    errors,
    handleChange,
    handleSubmit,
    isValid,
    getField,
  };
}
