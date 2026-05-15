import { useEffect, useState } from "react";
import { DpInput, DpCodeInput } from "~/components/ui";
import { DpContentSet } from "~/components/ui";
import { generateSequenceCode } from "~/features/system/sequences";
import {
  createCompany,
  updateCompany,
  type CompanyRecord,
} from "~/features/platform/companies/index";

export interface CompanyDialogProps {
  visible: boolean;
  item: CompanyRecord | null;
  onHide: () => void;
  onSaved: () => void;
}

const TAX_ID_DUPLICATE_MSG = "Ya existe una empresa con ese RUC";
const CODE_DUPLICATE_MSG = "Ya existe una empresa con ese código";
const COUNTRY_OPTIONS = [{ label: "Perú (PE)", value: "PE" as const }];
const CURRENCY_OPTIONS = [
  { label: "Sol peruano (PEN · S/)", value: "PEN" as const },
  { label: "Dólar estadounidense (USD · $)", value: "USD" as const },
  { label: "Euro (EUR · €)", value: "EUR" as const },
];

function isTaxIdDuplicateError(message: string): boolean {
  return message.includes("RUC") || message.includes("taxid_duplicate");
}

function isCodeDuplicateError(message: string): boolean {
  return message.includes("code_duplicate") || message.includes(CODE_DUPLICATE_MSG);
}

export default function CompanyDialog({ visible, item, onHide, onSaved }: CompanyDialogProps) {
  const isEdit = item !== null;

  const [name, setName] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [taxId, setTaxId] = useState("");
  const [code, setCode] = useState("");
  const [countryCode, setCountryCode] = useState<"PE">("PE");
  const [allowedCurrencies, setAllowedCurrencies] = useState<Array<"PEN" | "USD" | "EUR">>(["PEN"]);
  const [defaultCurrency, setDefaultCurrency] = useState<"PEN" | "USD" | "EUR">("PEN");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (item) {
      setName(item.name);
      setStatus(item.status);
      setTaxId(item.taxId ?? "");
      setCode(item.code ?? "");
      setCountryCode(item.countryCode ?? "PE");
      const loadedAllowed: Array<"PEN" | "USD" | "EUR"> = item.allowedCurrencies?.length
        ? item.allowedCurrencies
        : ["PEN"];
      setAllowedCurrencies(loadedAllowed);
      const loadedDefault = item.defaultCurrency && loadedAllowed.includes(item.defaultCurrency)
        ? item.defaultCurrency
        : loadedAllowed[0];
      setDefaultCurrency((loadedDefault ?? "PEN") as "PEN" | "USD" | "EUR");
    } else {
      setName("");
      setStatus("active");
      setTaxId("");
      setCode("");
      setCountryCode("PE");
      setAllowedCurrencies(["PEN"]);
      setDefaultCurrency("PEN");
    }
  }, [visible, item]);

  useEffect(() => {
    if (allowedCurrencies.length === 0) return;
    if (!allowedCurrencies.includes(defaultCurrency)) {
      setDefaultCurrency(allowedCurrencies[0]!);
    }
  }, [allowedCurrencies, defaultCurrency]);

  const valid = name.trim().length > 0 && allowedCurrencies.length > 0;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateCompany(item.id, {
          name: name.trim(),
          status,
          taxId: taxId.trim() || undefined,
          countryCode,
          allowedCurrencies,
          defaultCurrency,
        });
      } else {
        const finalCode = await generateSequenceCode(code, "company");
        await createCompany({
          name: name.trim(),
          status,
          code: finalCode,
          taxId: taxId.trim() || undefined,
          countryCode,
          allowedCurrencies,
          defaultCurrency,
        });
      }
      onSaved();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al guardar";
      setError(
        isTaxIdDuplicateError(message)
          ? TAX_ID_DUPLICATE_MSG
          : isCodeDuplicateError(message)
            ? CODE_DUPLICATE_MSG
            : message
      );
    } finally {
      setSaving(false);
    }
  };

  const STATUS_SELECT_OPTIONS = [
    { label: "Activo", value: "active" },
    { label: "Inactivo", value: "inactive" },
  ];

  return (
    <DpContentSet
      title={isEdit ? "Editar empresa" : "Nueva empresa"}
      recordId={isEdit ? item.id : null}
      visible={visible}
      onHide={onHide}
      onCancel={onHide}
      onSave={handleSave}
      saving={saving}
      saveDisabled={!valid}
      showError={!!error}
      errorMessage={error ?? ""}
    >
      <div className="flex flex-col gap-4 pt-2">
        <DpCodeInput
          entity="company"
          label="Código"
          name="companyCode"
          value={isEdit ? (item.code ?? item.id) : code}
          onChange={isEdit ? () => {} : setCode}
          disabled={isEdit}
        />
        <DpInput
          type="input"
          label="Nombre"
          name="companyName"
          value={name}
          onChange={setName}
          placeholder="Nombre de la empresa"
        />
        <DpInput
          type="select"
          label="Estado"
          name="companyStatus"
          value={status}
          onChange={(v) => setStatus(v as "active" | "inactive")}
          options={STATUS_SELECT_OPTIONS}
        />
        <DpInput
          type="input"
          label="RUC / Tax ID"
          name="companyTaxId"
          value={taxId}
          onChange={setTaxId}
          placeholder="Número de RUC"
        />
        <DpInput
          type="select"
          label="País"
          name="companyCountryCode"
          value={countryCode}
          onChange={(v) => setCountryCode(String(v) as "PE")}
          options={COUNTRY_OPTIONS}
        />
        <DpInput
          type="multiselect"
          label="Monedas permitidas"
          name="companyAllowedCurrencies"
          value={allowedCurrencies}
          onChange={(v) => setAllowedCurrencies(v as Array<"PEN" | "USD" | "EUR">)}
          options={CURRENCY_OPTIONS}
          placeholder="Seleccionar monedas"
          filter
        />
        <DpInput
          type="select"
          label="Moneda por defecto"
          name="companyDefaultCurrency"
          value={defaultCurrency}
          onChange={(v) => setDefaultCurrency(String(v) as "PEN" | "USD" | "EUR")}
          options={CURRENCY_OPTIONS.filter((opt) => allowedCurrencies.includes(opt.value))}
          placeholder="Seleccionar moneda"
        />
      </div>
    </DpContentSet>
  );
}
