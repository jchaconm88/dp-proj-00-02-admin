// Copia local de @jchaconm88/ui (Dp*). Sincronizar con packages/ui cuando se estabilice.

export {
  DpContent,
  DpContentHeader,
  DpContentHeaderAction,
  DpContentSet,
  DpContentInfo,
  DpContentFilter,
  DpFilterItem,
  createDateRangeMaxDaysRule,
  createDateRangeOrderRule,
  createRequiredIfRule,
  createMaxLengthRule,
  createMinLengthRule,
  createDateNotFutureRule,
  createAtLeastOneSelectedRule,
} from "./DpContent";
export type {
  DpContentProps,
  DpContentHeaderProps,
  DpContentHeaderActionProps,
  DpContentSetProps,
  DpContentInfoProps,
  DpContentFilterProps,
  DpContentFilterRef,
  DpFilterDef,
  DpFilterRule,
  DateRangeMaxDaysRuleOptions,
  DateRangeOrderRuleOptions,
  RequiredIfRuleOptions,
  StringLengthRuleOptions,
  DateNotFutureRuleOptions,
  AtLeastOneSelectedRuleOptions,
  DpFilterItemProps,
  DpFilterItemRenderProps,
} from "./DpContent";

export { DpTable, DpTColumn } from "./DpTable";
export type {
  DpTableDefColumn,
  DpTableDefColumnType,
  DpTableFooterTotals,
  DpTableRef,
  DpTableRow,
} from "./DpTable";

export { DpConfirmDialog } from "./DpConfirmDialog";
export type { DpConfirmDialogProps } from "./DpConfirmDialog";

export { DpInput } from "./DpInput";
export type { DpInputProps, DpInputOption, DpInputType } from "./DpInput";

export { DpCodeInput } from "./DpCodeInput";
export type { DpCodeInputProps } from "./DpCodeInput";

export { DpCard } from "./DpCard";
export type { DpCardProps, DpCardTitleSize } from "./DpCard";

export type { StatusSeverity, PrimeStatusSeverity, CustomStatusSeverity, StatusOption } from "./constants/status-options";
export { isPrimeStatusSeverity, PRIME_STATUS_SEVERITIES } from "./constants/status-options";
