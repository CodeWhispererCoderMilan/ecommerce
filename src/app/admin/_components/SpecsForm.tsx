"use client";

interface Props {
  categorySlug: string;
  specs: Record<string, unknown>;
  onChange: (specs: Record<string, unknown>) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-500" />
  );
}

function NumberInput({ value, onChange, placeholder, min, step }: { value: number | ""; onChange: (v: number | null) => void; placeholder?: string; min?: number; step?: number }) {
  return (
    <input type="number" value={value} onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
      placeholder={placeholder} min={min} step={step}
      className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-500" />
  );
}

function BoolSelect({ value, onChange }: { value: boolean | undefined; onChange: (v: boolean | undefined) => void }) {
  return (
    <select value={value === undefined ? "" : value ? "true" : "false"}
      onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value === "true")}
      className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-500 bg-white">
      <option value="">—</option>
      <option value="true">DA</option>
      <option value="false">NU</option>
    </select>
  );
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-500 bg-white">
      <option value="">—</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function MultiSelect({ value, onChange, options }: { value: string[]; onChange: (v: string[]) => void; options: string[] }) {
  function toggle(opt: string) {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button key={opt} type="button" onClick={() => toggle(opt)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
            value.includes(opt)
              ? "bg-zinc-900 text-white border-zinc-900"
              : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
          }`}>
          {opt}
        </button>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-xs font-black uppercase tracking-widest text-blue-600 pt-4 pb-1 border-b border-zinc-100">{children}</h4>;
}

export default function SpecsForm({ categorySlug, specs, onChange }: Props) {
  function set(key: string, value: unknown) {
    onChange({ ...specs, [key]: value });
  }

  const s = specs as Record<string, unknown>;
  const connectivity = (s.connectivity as string[] | undefined) ?? [];
  const platform = (s.platform as string[] | undefined) ?? [];

  if (categorySlug === "tastaturi") {
    return (
      <div className="space-y-3">
        <SectionTitle>Ergonomie</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Layout">
            <SelectInput value={String(s.layout ?? "")} onChange={(v) => set("layout", v)}
              options={["40%","60%","65%","75%","TKL","100%","Numpad"]} />
          </Field>
          <Field label="Material carcasă">
            <TextInput value={String(s.material ?? "")} onChange={(v) => set("material", v)} placeholder="Aluminum, Plastic…" />
          </Field>
          <Field label="Culoare">
            <TextInput value={String(s.color ?? "")} onChange={(v) => set("color", v)} placeholder="Negru, Alb…" />
          </Field>
          <Field label="Iluminare (RGB)">
            <BoolSelect value={s.rgb as boolean | undefined} onChange={(v) => set("rgb", v)} />
          </Field>
          <Field label="Suport pentru pumn">
            <BoolSelect value={s.wrist_rest as boolean | undefined} onChange={(v) => set("wrist_rest", v)} />
          </Field>
          <Field label="Low profile">
            <BoolSelect value={s.low_profile as boolean | undefined} onChange={(v) => set("low_profile", v)} />
          </Field>
        </div>

        <SectionTitle>Performanță</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Rollover">
            <TextInput value={String(s.rollover ?? "")} onChange={(v) => set("rollover", v)} placeholder="N-Key" />
          </Field>
          <Field label="Polling rate (Hz)">
            <NumberInput value={s.polling_rate_hz as number ?? ""} onChange={(v) => set("polling_rate_hz", v)} placeholder="1000" min={0} />
          </Field>
          <Field label="8K Polling rate">
            <BoolSelect value={s.polling_rate_8k as boolean | undefined} onChange={(v) => set("polling_rate_8k", v)} />
          </Field>
          <Field label="Memorie on-board">
            <BoolSelect value={s.memory as boolean | undefined} onChange={(v) => set("memory", v)} />
          </Field>
        </div>

        <SectionTitle>Taste</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Număr taste">
            <NumberInput value={s.key_count as number ?? ""} onChange={(v) => set("key_count", v)} placeholder="98" min={0} />
          </Field>
          <Field label="Material keycap">
            <SelectInput value={String(s.keycap_material ?? "")} onChange={(v) => set("keycap_material", v)} options={["PBT","ABS","POM"]} />
          </Field>
          <Field label="Switch">
            <TextInput value={String(s.switch_type ?? "")} onChange={(v) => set("switch_type", v)} placeholder="Gateron Nebula Magnetic" />
          </Field>
          <Field label="Tip switch">
            <SelectInput value={String(s.switch_variant ?? "")} onChange={(v) => set("switch_variant", v)} options={["Linear","Tactile","Clicky","Magnetic"]} />
          </Field>
          <Field label="Brand switch">
            <TextInput value={String(s.switch_brand ?? "")} onChange={(v) => set("switch_brand", v)} placeholder="Gateron, Cherry…" />
          </Field>
          <Field label="Hot-Swap">
            <BoolSelect value={s.hot_swap as boolean | undefined} onChange={(v) => set("hot_swap", v)} />
          </Field>
          <Field label="Taste macro">
            <BoolSelect value={s.macro_keys as boolean | undefined} onChange={(v) => set("macro_keys", v)} />
          </Field>
          <Field label="Taste multimedia">
            <BoolSelect value={s.multimedia_keys as boolean | undefined} onChange={(v) => set("multimedia_keys", v)} />
          </Field>
        </div>

        <SectionTitle>Conectivitate</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Mod conectare">
            <MultiSelect value={connectivity} onChange={(v) => set("connectivity", v)}
              options={["USB-C","Bluetooth","2.4 GHz Wireless"]} />
          </Field>
          <Field label="Autonomie baterie">
            <TextInput value={String(s.battery_life ?? "")} onChange={(v) => set("battery_life", v)} placeholder="25 ore" />
          </Field>
          <Field label="Conector">
            <TextInput value={String(s.connector ?? "")} onChange={(v) => set("connector", v)} placeholder="USB-C, Bluetooth, RF 2.4 GHz" />
          </Field>
          <Field label="Tip cablu">
            <SelectInput value={String(s.cable_type ?? "")} onChange={(v) => set("cable_type", v)} options={["Braided","Standard","Detașabil"]} />
          </Field>
          <Field label="Lungime cablu">
            <TextInput value={String(s.cable_length ?? "")} onChange={(v) => set("cable_length", v)} placeholder="1.5 m" />
          </Field>
          <Field label="Cablu detașabil">
            <BoolSelect value={s.detachable_cable as boolean | undefined} onChange={(v) => set("detachable_cable", v)} />
          </Field>
        </div>

        <SectionTitle>Altele</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Software">
            <TextInput value={String(s.software ?? "")} onChange={(v) => set("software", v)} placeholder="Keychron Engine…" />
          </Field>
        </div>
      </div>
    );
  }

  if (categorySlug === "mouse-uri") {
    return (
      <div className="space-y-3">
        <SectionTitle>Performanță senzor</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Tip senzor">
            <SelectInput value={String(s.sensor_type ?? "")} onChange={(v) => set("sensor_type", v)} options={["Optical","Laser"]} />
          </Field>
          <Field label="Model senzor">
            <TextInput value={String(s.sensor ?? "")} onChange={(v) => set("sensor", v)} placeholder="PMW3395, HERO 25K…" />
          </Field>
          <Field label="DPI maxim">
            <NumberInput value={s.max_dpi as number ?? ""} onChange={(v) => set("max_dpi", v)} placeholder="25600" min={0} />
          </Field>
          <Field label="DPI ajustabil">
            <BoolSelect value={s.adjustable_dpi as boolean | undefined} onChange={(v) => set("adjustable_dpi", v)} />
          </Field>
          <Field label="Viteză urmărire (IPS)">
            <NumberInput value={s.tracking_speed_ips as number ?? ""} onChange={(v) => set("tracking_speed_ips", v)} placeholder="750" min={0} />
          </Field>
          <Field label="Accelerație (G)">
            <NumberInput value={s.acceleration_g as number ?? ""} onChange={(v) => set("acceleration_g", v)} placeholder="50" min={0} />
          </Field>
          <Field label="LOD">
            <TextInput value={String(s.lod ?? "")} onChange={(v) => set("lod", v)} placeholder="1-2 mm" />
          </Field>
          <Field label="Polling rate (Hz)">
            <NumberInput value={s.polling_rate_hz as number ?? ""} onChange={(v) => set("polling_rate_hz", v)} placeholder="1000" min={0} />
          </Field>
          <Field label="8K Polling rate">
            <BoolSelect value={s.polling_rate_8k as boolean | undefined} onChange={(v) => set("polling_rate_8k", v)} />
          </Field>
          <Field label="Switch-uri butoane">
            <TextInput value={String(s.switch_buttons ?? "")} onChange={(v) => set("switch_buttons", v)} placeholder="Omron, Huano…" />
          </Field>
          <Field label="Memorie on-board">
            <BoolSelect value={s.memory as boolean | undefined} onChange={(v) => set("memory", v)} />
          </Field>
        </div>

        <SectionTitle>Ergonomie</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Formă">
            <SelectInput value={String(s.shape ?? "")} onChange={(v) => set("shape", v)}
              options={["Ergonomic","Ambidextru","Universal"]} />
          </Field>
          <Field label="Grip">
            <TextInput value={String(s.grip ?? "")} onChange={(v) => set("grip", v)} placeholder="Claw, Palm, Fingertip" />
          </Field>
          <Field label="Greutate (g)">
            <NumberInput value={s.weight_grams as number ?? ""} onChange={(v) => set("weight_grams", v)} placeholder="60" min={0} />
          </Field>
          <Field label="Număr butoane">
            <NumberInput value={s.buttons as number ?? ""} onChange={(v) => set("buttons", v)} placeholder="5" min={0} />
          </Field>
          <Field label="Iluminare (RGB)">
            <BoolSelect value={s.rgb as boolean | undefined} onChange={(v) => set("rgb", v)} />
          </Field>
        </div>

        <SectionTitle>Conectivitate</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Mod conectare">
            <MultiSelect value={connectivity} onChange={(v) => set("connectivity", v)}
              options={["USB-A","USB-C","Bluetooth","2.4 GHz Wireless"]} />
          </Field>
          <Field label="Autonomie baterie">
            <TextInput value={String(s.battery_life ?? "")} onChange={(v) => set("battery_life", v)} placeholder="150 ore" />
          </Field>
          <Field label="Tip cablu">
            <TextInput value={String(s.cable_type ?? "")} onChange={(v) => set("cable_type", v)} placeholder="Braided" />
          </Field>
          <Field label="Lungime cablu">
            <TextInput value={String(s.cable_length ?? "")} onChange={(v) => set("cable_length", v)} placeholder="1.5 m" />
          </Field>
          <Field label="Conector">
            <TextInput value={String(s.connector ?? "")} onChange={(v) => set("connector", v)} placeholder="USB-C" />
          </Field>
        </div>
      </div>
    );
  }

  if (categorySlug === "controllere") {
    return (
      <div className="space-y-3">
        <SectionTitle>Platforme</SectionTitle>
        <Field label="Platforme compatibile">
          <MultiSelect value={platform} onChange={(v) => set("platform", v)}
            options={["PC","Nintendo Switch","PlayStation","Xbox","Android","iOS","macOS"]} />
        </Field>

        <SectionTitle>Hardware</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Hall Effect">
            <BoolSelect value={s.hall_effect as boolean | undefined} onChange={(v) => set("hall_effect", v)} />
          </Field>
          <Field label="Padele spate">
            <NumberInput value={s.back_paddles as number ?? ""} onChange={(v) => set("back_paddles", v)} placeholder="0" min={0} />
          </Field>
          <Field label="Vibrații (Rumble)">
            <BoolSelect value={s.rumble as boolean | undefined} onChange={(v) => set("rumble", v)} />
          </Field>
          <Field label="Autonomie (ore)">
            <NumberInput value={s.battery_life_hours as number ?? ""} onChange={(v) => set("battery_life_hours", v)} placeholder="20" min={0} />
          </Field>
        </div>

        <SectionTitle>Conectivitate</SectionTitle>
        <Field label="Mod conectare">
          <MultiSelect value={connectivity} onChange={(v) => set("connectivity", v)}
            options={["Cablu USB-C","Bluetooth","2.4 GHz Wireless","Hyperlink"]} />
        </Field>
      </div>
    );
  }

  if (categorySlug === "volan-gaming") {
    return (
      <div className="space-y-3">
        <SectionTitle>Specificații</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Grade rotație">
            <NumberInput value={s.degrees_rotation as number ?? ""} onChange={(v) => set("degrees_rotation", v)} placeholder="900" min={0} />
          </Field>
          <Field label="Force Feedback">
            <BoolSelect value={s.force_feedback as boolean | undefined} onChange={(v) => set("force_feedback", v)} />
          </Field>
          <Field label="Pedale incluse">
            <BoolSelect value={s.pedals_included as boolean | undefined} onChange={(v) => set("pedals_included", v)} />
          </Field>
        </div>
        <SectionTitle>Platforme</SectionTitle>
        <Field label="Platforme compatibile">
          <MultiSelect value={platform} onChange={(v) => set("platform", v)}
            options={["PC","PlayStation","Xbox","Nintendo Switch"]} />
        </Field>
      </div>
    );
  }

  if (categorySlug === "accesorii") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Tip accesoriu">
            <SelectInput value={String(s.type ?? "")} onChange={(v) => set("type", v)}
              options={["Mousepad","Switch","Folie","Husa","Stand","Incarcator","Altele"]} />
          </Field>
          <Field label="Material">
            <TextInput value={String(s.material ?? "")} onChange={(v) => set("material", v)} placeholder="Plastic, Metal…" />
          </Field>
          <Field label="Compatibilitate">
            <TextInput value={String(s.compatibility ?? "")} onChange={(v) => set("compatibility", v)} placeholder="Universal, Keychron K…" />
          </Field>
          <Field label="Dimensiuni">
            <TextInput value={String(s.dimensions ?? "")} onChange={(v) => set("dimensions", v)} placeholder="350×300×4 mm" />
          </Field>
        </div>
      </div>
    );
  }

  return (
    <p className="text-sm text-zinc-400 italic">Selectează o categorie pentru a vedea câmpurile specifice.</p>
  );
}
