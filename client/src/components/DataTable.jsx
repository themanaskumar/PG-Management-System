// A reusable table that takes data and columns
const DataTable = ({ columns, data, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-3">{col.label}</th>
            ))}
            <th className="px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item._id} className="bg-white border-b hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4">
                  {/* Handle nested properties if needed, or just display */}
                  {item[col.key]}
                </td>
              ))}
              <td className="px-6 py-4 flex gap-2">
                 {onEdit && (
                    <button onClick={() => onEdit(item)} className="text-blue-600 hover:underline">Edit</button>
                 )}
                 {onDelete && (
                    <button onClick={() => onDelete(item._id)} className="text-red-600 hover:underline">Delete</button>
                 )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;