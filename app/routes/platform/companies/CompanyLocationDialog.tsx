import { useEffect, useState } from "react";
import { useNavigation } from "react-router";
import { DpContentSet, DpInput } from "~/components/ui";
import {
  createCompanyLocation,
  updateCompanyLocation,
} from "~/features/platform/company-locations/index";
import type { CompanyLocationRecord } from "~/features/platform/company-locations/index";
import { getUbigeos } from "~/features/platform/ubigeos";

interface EditingState {
  id: string | null;
  name: string;
  description: string;
  ubigeo: string;
  city: string;
  country: string;
  district: string;
  address: string;
  active: boolean;
}

const EMPTY_EDITING: EditingState = {
  id: null,
  name: "",
  description: "",
  ubigeo: "",
  city: "",
  country: "PE",
  district: "",
  address: "",
  active: true,
};

interface CompanyLocationDialogProps {
  visible: boolean;
  companyId: string | null;
  isAdd: boolean;
  editItem: CompanyLocationRecord | null;
  onHide: () => void;
  onSaved: () => void;
}

export default function CompanyLocationDialog({
  visible, companyId, isAdd, editItem, onHide, onSaved,
}: CompanyLocationDialogProps) {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingState>(EMPTY_EDITING);
  const [ubigeoOptions, setUbigeoOptions] = useState<{ label: string; value: string }[]>([]);
  const [ubigeoNameByCode, setUbigeoNameByCode] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (!editItem) {
      setEditing(EMPTY_EDITING);
      return;
    }
    setEditing({
      id: editItem.id,
      name: editItem.name,
      description: editItem.description,
      ubigeo: editItem.ubigeo,
      city: editItem.city,
      country: editItem.country || "PE",
      district: editItem.district,
      address: editItem.address,
      active: editItem.active !== false,
    });
  }, [visible, editItem]);

  useEffect(() => {
    if (!visible) return;
    void getUbigeos("PE")
      .then((items) => {
        const byCode: Record<string, string> = {};
        for (const item of items) byCode[item.code] = item.name;
        setUbigeoNameByCode(byCode);
        setUbigeoOptions(items.map((item) => ({ label: `${item.name} (${item.code})`, value: item.code })));
      })
      .catch(() => {
        setUbigeoNameByCode({});
        setUbigeoOptions([]);
      });
  }, [visible]);

  const parseUbigeo = (name: string): { city: string; district: string } => {
    const parts = name.split("—").map((x) => x.trim()).filter(Boolean);
    return {
      district: parts[0] ?? "",
      city: parts[1] ?? parts[0] ?? "",
    };
  };

  const handleHide = () => {
    if (!saving) onHide();
  };

  const valid = editing.name.trim().length > 0 && editing.ubigeo.trim().length === 6;

  const handleSave = async () => {
    if (!companyId || !valid) return;
    setSaving(true);
    setError(null);
    try {
      const ubigeoName = ubigeoNameByCode[editing.ubigeo.trim()] ?? "";
      const ubigeoDerived = parseUbigeo(ubigeoName);
      const payload = {
        companyId,
        name: editing.name.trim(),
        description: editing.description.trim(),
        ubigeo: editing.ubigeo.trim(),
        city: isAdd ? ubigeoDerived.city : editing.city.trim(),
        country: editing.country.trim() || "PE",
        district: isAdd ? ubigeoDerived.district : editing.district.trim(),
        address: editing.address.trim(),
        active: editing.active,
      };
      if (editing.id) {
        await updateCompanyLocation(editing.id, payload);
      } else {
        await createCompanyLocation(payload);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la sede.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DpContentSet
      title={editing.id ? "Editar sede" : "Nueva sede"}
      visible={visible}
      onHide={handleHide}
      onCancel={handleHide}
      onSave={handleSave}
      saving={saving || isNavigating}
      saveDisabled={!valid}
      showError={!!error}
      errorMessage={error ?? ""}
    >
      <div className="flex flex-col gap-4 pt-2">
        <DpInput type="input" label="Nombre" value={editing.name} onChange={(v) => setEditing((s) => ({ ...s, name: v }))} />
        <DpInput type="input" label="Descripción" value={editing.description} onChange={(v) => setEditing((s) => ({ ...s, description: v }))} />
        <DpInput
          type="select"
          label="Ubigeo"
          value={editing.ubigeo}
          onChange={(v) => {
            const code = String(v);
            const selectedName = ubigeoNameByCode[code] ?? "";
            const ubigeoDerived = parseUbigeo(selectedName);
            setEditing((s) => ({
              ...s,
              ubigeo: code,
              city: selectedName ? ubigeoDerived.city : s.city,
              district: selectedName ? ubigeoDerived.district : s.district,
            }));
          }}
          options={[{ label: "— Seleccionar distrito —", value: "" }, ...ubigeoOptions]}
          placeholder="Buscar por nombre o UBIGEO"
          filter
        />
        {!isAdd && (
          <DpInput type="input" label="Ciudad" value={editing.city} onChange={(v) => setEditing((s) => ({ ...s, city: v }))} />
        )}
        {!isAdd && (
          <DpInput type="input" label="Distrito" value={editing.district} onChange={(v) => setEditing((s) => ({ ...s, district: v }))} />
        )}
        <DpInput type="input" label="Dirección" value={editing.address} onChange={(v) => setEditing((s) => ({ ...s, address: v }))} />
        <DpInput type="check" label="Activo" value={editing.active} onChange={(v) => setEditing((s) => ({ ...s, active: v }))} />
      </div>
    </DpContentSet>
  );
}
