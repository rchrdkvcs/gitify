export interface FilterDescriptor<Value, Source> {
  param: string;
  default: Value;
  fromProps(source: Source): Value;
  toQuery(value: Value): string;
  alwaysSend?: boolean;
}

export type FilterSchema<Values, Source> = {
  [Key in keyof Values]: FilterDescriptor<Values[Key], Source>;
};

export type FilterQuery = Record<string, string | undefined>;

function schemaKeys<Values, Source>(schema: FilterSchema<Values, Source>) {
  return Object.keys(schema) as (keyof Values)[];
}

function isFilterActive<Value, Source>(descriptor: FilterDescriptor<Value, Source>, value: Value) {
  return descriptor.toQuery(value) !== descriptor.toQuery(descriptor.default);
}

export function readFilters<Values, Source>(
  schema: FilterSchema<Values, Source>,
  source: Source,
): Values {
  const values = {} as Values;
  for (const key of schemaKeys(schema)) {
    values[key] = schema[key].fromProps(source);
  }
  return values;
}

export function defaultFilters<Values, Source>(schema: FilterSchema<Values, Source>): Values {
  const values = {} as Values;
  for (const key of schemaKeys(schema)) {
    values[key] = structuredClone(schema[key].default);
  }
  return values;
}

export function hasActiveFilters<Values, Source>(
  schema: FilterSchema<Values, Source>,
  values: Values,
) {
  return schemaKeys(schema).some((key) => isFilterActive(schema[key], values[key]));
}

export function filterQuery<Values, Source>(
  schema: FilterSchema<Values, Source>,
  values: Values,
): FilterQuery {
  const query: FilterQuery = {};
  for (const key of schemaKeys(schema)) {
    const descriptor = schema[key];
    const serialized = descriptor.toQuery(values[key]);
    const omitted = serialized === "" || !isFilterActive(descriptor, values[key]);
    query[descriptor.param] = omitted && !descriptor.alwaysSend ? undefined : serialized;
  }
  return query;
}
