import React, { useMemo, useState } from "react";
import { useMKitPreview } from "./MKitPreviewProvider";
import { DBRow } from "shared/types/mdb";

export const MKitContextPreview: React.FC = () => {
  const { spaceKit, getContextData } = useMKitPreview();
  const [selectedTable, setSelectedTable] = useState<string>("");

  // Get list of available tables
  const tables = useMemo(() => {
    if (!spaceKit.context) return [];
    return Object.keys(spaceKit.context);
  }, [spaceKit]);

  // Get current table data
  const currentTableData = useMemo(() => {
    const tableName = selectedTable || tables[0];
    if (!tableName || !spaceKit.context?.[tableName]) return null;

    return spaceKit.context[tableName];
  }, [selectedTable, tables, spaceKit]);

  if (!tables.length) {
    return (
      <div className="mk-mkit-context-empty">
        <p>No context data in this space kit</p>
      </div>
    );
  }

  return (
    <div className="mk-mkit-context-preview">
      {tables.length > 1 && (
        <div className="mk-mkit-context-tabs">
          {tables.map(tableName => (
            <button
              key={tableName}
              className={`mk-mkit-tab ${(selectedTable || tables[0]) === tableName ? 'active' : ''}`}
              onClick={() => setSelectedTable(tableName)}
            >
              {spaceKit.context![tableName].schema?.name || tableName}
            </button>
          ))}
        </div>
      )}

      {currentTableData && (
        <div className="mk-mkit-table-container">
          <div className="mk-mkit-table-info">
            <h3>{currentTableData.schema?.name || selectedTable || tables[0]}</h3>
            <span className="mk-mkit-row-count">
              {currentTableData.rows?.length || 0} rows
            </span>
          </div>

          {currentTableData.rows && currentTableData.rows.length > 0 ? (
            <div className="mk-mkit-table-scroll">
              <table className="mk-mkit-table">
                <thead>
                  <tr>
                    {currentTableData.cols?.map(col => (
                      <th key={col.name}>
                        <div className="mk-mkit-col-header">
                          <span className="mk-mkit-col-name">{col.name}</span>
                          <span className="mk-mkit-col-type">{col.type}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentTableData.rows.slice(0, 100).map((row: DBRow, index: number) => (
                    <tr key={index}>
                      {currentTableData.cols?.map(col => (
                        <td key={col.name}>
                          {renderCellValue(row[col.name], col.type)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {currentTableData.rows.length > 100 && (
                <div className="mk-mkit-table-truncated">
                  Showing first 100 rows of {currentTableData.rows.length}
                </div>
              )}
            </div>
          ) : (
            <div className="mk-mkit-table-empty">
              No data in this table
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to render cell values based on type
function renderCellValue(value: any, type: string): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="mk-mkit-null">—</span>;
  }

  switch (type) {
    case 'boolean':
      return (
        <input
          type="checkbox"
          checked={value === true || value === 'true'}
          readOnly
          className="mk-mkit-checkbox"
        />
      );

    case 'link':
    case 'file':
      return <span className="mk-mkit-link">{value}</span>;

    case 'tags':
    case 'tags-multi':
    case 'option-multi':
      const tags = Array.isArray(value) ? value : (value || '').split(',').filter(Boolean);
      return (
        <div className="mk-mkit-tags">
          {tags.map((tag: string, i: number) => (
            <span key={i} className="mk-mkit-tag">{tag.trim()}</span>
          ))}
        </div>
      );

    case 'number':
      return <span className="mk-mkit-number">{value}</span>;

    case 'date':
      try {
        const date = new Date(value);
        return <span className="mk-mkit-date">{date.toLocaleDateString()}</span>;
      } catch {
        return <span>{value}</span>;
      }

    case 'object':
    case 'object-multi':
      try {
        const obj = typeof value === 'string' ? JSON.parse(value) : value;
        return <span className="mk-mkit-object">{JSON.stringify(obj, null, 2)}</span>;
      } catch {
        return <span>{value}</span>;
      }

    default:
      return <span>{String(value)}</span>;
  }
}