import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Copy, Plus, Trash } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Option {
  label: string;
  value: string;
  displayOrder: number;
  hidden: boolean;
  readonly: boolean;
}

interface FileContentsTableProps {
  headers: string[]
  rows: string[][]
  onDeleteRow: (index: number) => void
  onCloneRow: (index: number) => void
  onFieldTypeChange: (rowIndex: number, newFieldType: string) => void
  onTypeChange: (rowIndex: number, newType: string) => void
  onCellChange: (rowIndex: number, columnIndex: number, newValue: string | boolean) => void
  onOptionsChange: (rowIndex: number, newOptions: Option[]) => void
}

export function FileContentsTable({
  headers,
  rows,
  onDeleteRow,
  onCloneRow,
  onFieldTypeChange,
  onTypeChange,
  onCellChange,
  onOptionsChange
}: FileContentsTableProps) {
  const typeIndex = headers.findIndex(header => header.toLowerCase() === 'type');
  const fieldTypeIndex = headers.findIndex(header => header.toLowerCase() === 'field type');
  const nameIndex = headers.findIndex(header => header.toLowerCase() === 'name');
  const internalNameIndex = headers.findIndex(header => header.toLowerCase() === 'internal name');
  const descriptionIndex = headers.findIndex(header => header.toLowerCase() === 'description');
  const groupNameIndex = headers.findIndex(header => header.toLowerCase() === 'group name');
  const formFieldIndex = headers.findIndex(header => header.toLowerCase() === 'form field');
  const hiddenIndex = headers.findIndex(header => header.toLowerCase() === 'hidden');
  const optionsIndex = headers.findIndex(header => header.toLowerCase() === 'options');

  const renderOptionsCell = (rowIndex: number, cellValue: string) => {
    let options: Option[] = [];
    if (cellValue && typeof cellValue === 'string' && cellValue.trim() !== '') {
      try {
        const parsed = JSON.parse(cellValue);
        if (Array.isArray(parsed)) {
          options = parsed.map(option => ({
            label: option.label || '',
            value: option.value || '',
            displayOrder: option.displayOrder || 0,
            hidden: !!option.hidden,
            readonly: !!option.readonly
          }));
        } else {
          console.warn('Options are not in array format:', parsed);
        }
      } catch (e) {
        console.error('Error parsing options:', e);
      }
    }

    const updateOption = (index: number, field: keyof Option, value: string | boolean | number) => {
      const newOptions = [...options];
      newOptions[index] = { ...newOptions[index], [field]: value };
      onOptionsChange(rowIndex, newOptions);
    };

    const addOption = () => {
      const newOptions = [...options, { label: '', value: '', displayOrder: options.length, hidden: false, readonly: false }];
      onOptionsChange(rowIndex, newOptions);
    };

    const removeOption = (index: number) => {
      const newOptions = options.filter((_, i) => i !== index);
      onOptionsChange(rowIndex, newOptions);
    };

    return (
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex flex-col sm:flex-row w-full gap-2 mb-2">
            <Input
              value={option.label}
              onChange={(e) => updateOption(index, 'label', e.target.value)}
              className="w-[250px] text-sm"
              placeholder="Label"
            />
            <Input
              value={option.value}
              onChange={(e) => updateOption(index, 'value', e.target.value)}
              className="w-[250px] text-sm"
              placeholder="Value"
            />
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="number"
                value={option.displayOrder}
                onChange={(e) => updateOption(index, 'displayOrder', parseInt(e.target.value))}
                className="w-20 text-sm"
                placeholder="Order"
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`hidden-${rowIndex}-${index}`}
                  checked={option.hidden}
                  onCheckedChange={(checked) => updateOption(index, 'hidden', checked as boolean)}
                />
                <label htmlFor={`hidden-${rowIndex}-${index}`} className="text-sm">Hidden</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`readonly-${rowIndex}-${index}`}
                  checked={option.readonly}
                  onCheckedChange={(checked) => updateOption(index, 'readonly', checked as boolean)}
                />
                <label htmlFor={`readonly-${rowIndex}-${index}`} className="text-sm">Readonly</label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeOption(index)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button
          className="w-full bg-[#FF5E34] hover:bg-[#FF5E34]/90 text-white"
          size="sm"
          onClick={addOption}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Option
        </Button>
      </div>
    );
  };

  return (
    <div className="relative w-full overflow-x-auto">
      <Table className="w-full">
        <TableHeader className="sticky top-0 bg-background z-30">
          <TableRow>
            <TableHead className="w-[100px] sticky left-0 bg-background z-20">Actions</TableHead>
            <TableHead className="w-[50px] sticky left-[100px] bg-background z-20">Row</TableHead>
            {headers.map((header, index) => (
              <TableHead
                key={index}
                className={`min-w-[200px] ${header && header.toLowerCase() === 'options' ? 'min-w-[600px]' : ''}`}
              >
                {header}
              </TableHead>
            ))}
            {fieldTypeIndex === -1 && <TableHead className="min-w-[200px]">Field Type</TableHead>}
            {formFieldIndex === -1 && <TableHead className="min-w-[100px]">Form Field</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              <TableCell className="sticky left-0 bg-background z-10">
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => onDeleteRow(rowIndex)}
                    aria-label={`Delete row ${rowIndex + 1}`}
                    className="shadow-md hover:shadow-lg transition-shadow bg-[#FF5E34] hover:bg-[#FF5E34]/90 text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => onCloneRow(rowIndex)}
                    aria-label={`Clone row ${rowIndex + 1}`}
                    className="shadow-md hover:shadow-lg transition-shadow bg-[#FF5E34] hover:bg-[#FF5E34]/90 text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="sticky left-[100px] bg-background z-10 font-medium">{rowIndex + 1}</TableCell>
              {row.map((cell, cellIndex) => {
                const headerLower = headers[cellIndex] && headers[cellIndex].toLowerCase();
                if (cellIndex === nameIndex || cellIndex === internalNameIndex || cellIndex === groupNameIndex) {
                  return (
                    <TableCell key={cellIndex}>
                      <Input
                        value={cell}
                        onChange={(e) => onCellChange(rowIndex, cellIndex, e.target.value)}
                        className="w-full min-w-[200px]"
                      />
                    </TableCell>
                  );
                }
                if (cellIndex === descriptionIndex) {
                  return (
                    <TableCell key={cellIndex}>
                      <Textarea
                        value={cell}
                        onChange={(e) => onCellChange(rowIndex, cellIndex, e.target.value)}
                        className="w-full min-w-[300px]"
                        rows={3}
                      />
                    </TableCell>
                  );
                }
                if (headerLower === 'field type') {
                  return (
                    <TableCell key={cellIndex}>
                      <Select
                        value={cell}
                        onValueChange={(value) => onFieldTypeChange(rowIndex, value)}
                      >
                        <SelectTrigger className="w-full min-w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            switch (row[typeIndex]?.toLowerCase()) {
                              case 'enumeration':
                                return (
                                  <>
                                    <SelectItem value="select">Select</SelectItem>
                                    <SelectItem value="radio">Radio</SelectItem>
                                    <SelectItem value="checkbox">Checkbox</SelectItem>
                                  </>
                                );
                              case 'boolean':
                                return <SelectItem value="booleancheckbox">Boolean Checkbox</SelectItem>;
                              case 'number':
                                return <SelectItem value="number">Number</SelectItem>;
                              case 'date':
                              case 'datetime':
                                return <SelectItem value="date">Date</SelectItem>;
                              default:
                                return (
                                  <>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="textarea">Text Area</SelectItem>
                                    <SelectItem value="file">File</SelectItem>
                                    <SelectItem value="calculation_equation">Calculation Equation</SelectItem>
                                  </>
                                );
                            }
                          })()}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  );
                }
                if (headerLower === 'type') {
                  return (
                    <TableCell key={cellIndex}>
                      <Select
                        value={cell}
                        onValueChange={(value) => onTypeChange(rowIndex, value)}
                      >
                        <SelectTrigger className="w-full min-w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">String</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="datetime">DateTime</SelectItem>
                          <SelectItem value="enumeration">Enumeration</SelectItem>
                          <SelectItem value="bool">Boolean</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  );
                }
                if (headerLower === 'form field' || headerLower === 'hidden') {
                  return (
                    <TableCell key={cellIndex}>
                      <Checkbox
                        checked={cell.toLowerCase() === 'true'}
                        onCheckedChange={(checked) => onCellChange(rowIndex, cellIndex, checked)}
                      />
                    </TableCell>
                  );
                }
                if (cellIndex === optionsIndex) {
                  return (
                    <TableCell key={cellIndex}>
                      {renderOptionsCell(rowIndex, cell)}
                    </TableCell>
                  );
                }
                return (
                  <TableCell key={cellIndex} className="min-w-[200px]">
                    <Input
                      value={cell}
                      onChange={(e) => onCellChange(rowIndex, cellIndex, e.target.value)}
                      className="w-full"
                    />
                  </TableCell>
                );
              })}
              {fieldTypeIndex === -1 && (
                <TableCell>
                  <Select
                    value={getFieldType(row[typeIndex])}
                    onValueChange={(value) => onFieldTypeChange(rowIndex, value)}
                  >
                    <SelectTrigger className="w-full min-w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        switch (row[typeIndex]?.toLowerCase()) {
                          case 'enumeration':
                            return (
                              <>
                                <SelectItem value="select">Select</SelectItem>
                                <SelectItem value="radio">Radio</SelectItem>
                                <SelectItem value="checkbox">Checkbox</SelectItem>
                              </>
                            );
                          case 'boolean':
                            return <SelectItem value="booleancheckbox">Boolean Checkbox</SelectItem>;
                          case 'number':
                            return <SelectItem value="number">Number</SelectItem>;
                          case 'date':
                          case 'datetime':
                            return <SelectItem value="date">Date</SelectItem>;
                          default:
                            return (
                              <>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="textarea">Text Area</SelectItem>
                                <SelectItem value="file">File</SelectItem>
                                <SelectItem value="calculation_equation">Calculation Equation</SelectItem>
                              </>
                            );
                        }
                      })()}
                    </SelectContent>
                  </Select>
                </TableCell>
              )}
              {formFieldIndex === -1 && (
                <TableCell>
                  <Checkbox
                    checked={true}
                    onCheckedChange={(checked) => onCellChange(rowIndex, headers.length, checked)}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function getFieldType(type: string): string {
  switch (type.toLowerCase()) {
    case 'string':
      return 'text';
    case 'number':
      return 'number';
    case 'date':
    case 'datetime':
      return 'date';
    case 'bool':
    case 'boolean':
      return 'booleancheckbox';
    case 'enumeration':
      return 'select';
    default:
      return 'text';
  }
}
