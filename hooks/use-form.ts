"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnyObject, ObjectSchema, ValidationError } from "yup";

interface IUseForm<T extends Record<string, any>> {
  initial: T;
  schema: ObjectSchema<AnyObject, AnyObject, AnyObject, "">;
  onSubmit: (p: T) => void;
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
    setValues((p: any) => ({ ...p, [name]: value }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    const val = type === "checkbox" ? checked : value;
    handleValue(name, val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let payload = values;
      if (validation) {
        payload = (await validation.validate(values, {
          abortEarly: false,
        })) as T;
      }
      await onSubmit(payload);

      setErrors({});
    } catch (err) {
      if (err instanceof ValidationError) {
        handleSetError(err, true);
      }
    }
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
  };
}
