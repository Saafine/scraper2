import { DB_TABLE_IGNORE_COLUMN_VALUES_HASH } from './database.service';

interface WatchItem {
  label: string;
  selector: string;
  readMethod: string;
  useAsUniqueId?: boolean;
}

export interface WatchDTO {
  url: string;
  items: WatchItem[];
}

export interface QuerySearchIgnoreDTO {
  queryHash: string;
  values: any[];
}

export type QueryConfigurationValue = string[];
type QueryConfigurationLabel = string;

export interface QuerySearchResponse {
  queryHash: string;
  data: {
    labels: QueryConfigurationLabel[];
    values: QueryConfigurationValue[];
  };
}

export interface IgnoredSearchResult {
  [DB_TABLE_IGNORE_COLUMN_VALUES_HASH]: string;
}
