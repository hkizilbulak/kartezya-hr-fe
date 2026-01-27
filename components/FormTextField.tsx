import React from "react";
import { Form, Col } from "react-bootstrap";
import { Field, FieldProps } from "formik";
import InputMask from "react-input-mask";

type IProps = {
    as?: typeof Col;
    md?: number;
    controlId?: string;
    label?: string;
    name: string;
    type?: string;
    disabled?: boolean;
    mask?: string | (string | RegExp)[];
    maskChar?: string;
}

const FormTextField = ({
    as,
    md,
    controlId,
    label,
    name,
    type,
    disabled = false,
    mask,
    maskChar = "_",
}: IProps) => {
    return (
        <Field name={name}>
            {({ field, form }: FieldProps) => {
                const isInvalid = !!(form.touched[field.name] && form.errors[field.name]);
                const errorMessage = form.errors[field.name] as string | undefined;
                
                return (
                    <Form.Group as={as} md={md} controlId={controlId} className={`mb-3`}>
                        {label && <Form.Label>{label}</Form.Label>}
                        {mask ? (
                            <InputMask
                                mask={mask}
                                maskChar={maskChar}
                                {...field}
                                disabled={disabled}
                            >
                                {(inputProps: any) => (
                                    <Form.Control
                                        {...inputProps}
                                        type={type}
                                        disabled={disabled}
                                        isInvalid={isInvalid}
                                    />
                                )}
                            </InputMask>
                        ) : (
                            <Form.Control
                                {...field}
                                type={type}
                                disabled={disabled}
                                isInvalid={isInvalid}
                            />
                        )}
                        <Form.Control.Feedback type="invalid">
                            {errorMessage}
                        </Form.Control.Feedback>
                    </Form.Group>
                );
            }}
        </Field>
    );
};

export default FormTextField;