// src/features/trading/components/AddTradingAccountModal.tsx
import React, { useState } from 'react';
import { Modal }  from '@/shared/components/Modal';
import { Input }   from '@/shared/components/Input';
import { Select }  from '@/shared/components/Select';
import { Button }  from '@/shared/components/Button';
import { useBrokerProfiles }       from '../hooks/useBrokerProfiles';
import { useAddTradingAccount }    from '../hooks/useAddTradingAccount';
import type { CreateTradingAccountPayload } from '../services/trading.service';

// ─── Constants ────────────────────────────────────────────────

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'LIVE', label: 'Live' },
  { value: 'DEMO', label: 'Demo' },
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'IDR', label: 'IDR' },
];

// ─── Types ────────────────────────────────────────────────────

interface FormValues {
  broker_id:        string;
  account_number:   string;
  account_name:     string;
  account_type:     'LIVE' | 'DEMO';
  server_name:      string;
  base_currency:    string;
  leverage:         string;
  initial_deposit:  string;
}

interface FormErrors {
  broker_id?:       string;
  account_number?:  string;
  leverage?:        string;
  initial_deposit?: string;
}

const INITIAL_VALUES: FormValues = {
  broker_id:       '',
  account_number:  '',
  account_name:    '',
  account_type:    'LIVE',
  server_name:     '',
  base_currency:   'USD',
  leverage:        '100',
  initial_deposit: '0',
};

// ─── Validation ───────────────────────────────────────────────

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.broker_id)
    errors.broker_id = 'Please select a broker.';
  if (!values.account_number.trim())
    errors.account_number = 'Account number is required.';

  const lev = Number(values.leverage);
  if (!values.leverage || isNaN(lev) || lev < 1)
    errors.leverage = 'Leverage must be at least 1.';

  const dep = Number(values.initial_deposit);
  if (values.initial_deposit !== '' && (isNaN(dep) || dep < 0))
    errors.initial_deposit = 'Initial deposit must be 0 or more.';

  return errors;
}

// ─── Props ────────────────────────────────────────────────────

interface AddTradingAccountModalProps {
  isOpen:  boolean;
  onClose: () => void;
  userId:  string;
}

// ─── Component ────────────────────────────────────────────────

export function AddTradingAccountModal({
  isOpen,
  onClose,
  userId,
}: AddTradingAccountModalProps) {
  const { brokers, isLoading: brokersLoading } = useBrokerProfiles();
  const { addAccount, isSubmitting, reset }    = useAddTradingAccount(userId);

  const [values, setValues]   = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors]   = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string>('');

  // Reset state whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setValues(INITIAL_VALUES);
      setErrors({});
      setSubmitError('');
      reset();
    }
  }, [isOpen, reset]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');

    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload: CreateTradingAccountPayload = {
      broker_id:       values.broker_id,
      account_number:  values.account_number.trim(),
      account_name:    values.account_name.trim() || null,
      account_type:    values.account_type,
      server_name:     values.server_name.trim() || null,
      base_currency:   values.base_currency,
      leverage:        Number(values.leverage),
      initial_deposit: Number(values.initial_deposit),
    };

    try {
      const result = await addAccount(payload);
      if (result.error) {
        setSubmitError('Failed to create account. Please try again.');
        return;
      }
      onClose();
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.');
    }
  }

  const brokerOptions = (brokers ?? []).map((b) => ({
    value: b.id,
    label: b.broker_name,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Trading Account" size="md">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

        {/* Broker */}
        <Select
          name="broker_id"
          label="Broker"
          value={values.broker_id}
          onChange={handleChange}
          options={brokerOptions}
          placeholder={brokersLoading ? 'Loading brokers…' : 'Select broker'}
          disabled={brokersLoading}
          error={errors.broker_id}
        />

        {/* Account Number */}
        <Input
          name="account_number"
          label="Account Number"
          placeholder="e.g. 123456789"
          value={values.account_number}
          onChange={handleChange}
          error={errors.account_number}
        />

        {/* Account Name (optional) */}
        <Input
          name="account_name"
          label="Account Name (optional)"
          placeholder="e.g. My Main Account"
          value={values.account_name}
          onChange={handleChange}
        />

        {/* Account Type + Base Currency */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            name="account_type"
            label="Account Type"
            value={values.account_type}
            onChange={handleChange}
            options={ACCOUNT_TYPE_OPTIONS}
          />
          <Select
            name="base_currency"
            label="Base Currency"
            value={values.base_currency}
            onChange={handleChange}
            options={CURRENCY_OPTIONS}
          />
        </div>

        {/* Server Name (optional) */}
        <Input
          name="server_name"
          label="Server Name (optional)"
          placeholder="e.g. Exness-Real3"
          value={values.server_name}
          onChange={handleChange}
        />

        {/* Leverage + Initial Deposit */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            name="leverage"
            label="Leverage"
            type="number"
            min={1}
            placeholder="e.g. 100"
            value={values.leverage}
            onChange={handleChange}
            error={errors.leverage}
          />
          <Input
            name="initial_deposit"
            label="Initial Deposit"
            type="number"
            min={0}
            placeholder="e.g. 10000"
            value={values.initial_deposit}
            onChange={handleChange}
            error={errors.initial_deposit}
          />
        </div>

        {/* Submit Error */}
        {submitError && (
          <p className="text-xs text-mp-red">{submitError}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Add Account
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AddTradingAccountModal;
