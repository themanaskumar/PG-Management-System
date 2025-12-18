import React from 'react';

const DataTable = ({ columns, data, actions }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="p-4 border-b">
                {col.label}
              </th>
            ))}
            {actions && <th className="p-4 border-b text-center">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50 transition duration-150">
              {columns.map((col) => (
                <td key={col.key} className="p-4 text-gray-700">
                  {/* Updated Logic:
                     If the column has a custom 'render' function, use it.
                     Otherwise, just display the text as before.
                  */}
                  {col.render ? (
                    col.render(row)
                  ) : (
                    row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '-'
                  )}
                </td>
              ))}
              
              {actions && (
                <td className="p-4 text-center">
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}

          {data.length === 0 && (
            <tr>
              <td 
                colSpan={columns.length + (actions ? 1 : 0)} 
                className="p-8 text-center text-gray-500 italic"
              >
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;