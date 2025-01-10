'use client'
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import Papa from 'papaparse'
import { toast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileContentsTable } from "@/components/file-contents-table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { HelpCircle } from 'lucide-react'
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface HubspotProperty {
  name: string;
  label: string;
  description: string;
  groupName: string;
  type: 'string' | 'number' | 'date' | 'datetime' | 'enumeration' | 'bool';
  fieldType: 'textarea' | 'text' | 'date' | 'file' | 'number' | 'select' | 'radio' | 'checkbox' | 'booleancheckbox' | 'calculation_equation';
  hidden: boolean;
  displayOrder: number;
  formField: boolean;
  hasUniqueValue: boolean;
  options?: {
    label: string;
    value: string;
    displayOrder: number;
    hidden: boolean;
    readonly: boolean;
  }[];
}

export default function BulkUpload() {
  const [objectType, setObjectType] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<{ headers: string[], rows: string[][] } | null>(null);
  const [excludeDefaultProperties, setExcludeDefaultProperties] = useState(true);
  const [hubspotImportObject, setHubspotImportObject] = useState<{ inputs: HubspotProperty[] } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tableMaxHeight, setTableMaxHeight] = useState<number | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [customObjects, setCustomObjects] = useState<Array<{ name: string, objectTypeId: string, groupNames: string[] }>>([]);
  const [isLoadingCustomObjects, setIsLoadingCustomObjects] = useState(false);
  const [customObjectsError, setCustomObjectsError] = useState<string | null>(null);
  const [selectedCustomObject, setSelectedCustomObject] = useState<string | null>(null);
  const [standardObjectGroups, setStandardObjectGroups] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const updateTableHeight = () => {
      if (tableContainerRef.current) {
        const windowHeight = window.innerHeight;
        const tableTop = tableContainerRef.current.getBoundingClientRect().top;
        const newMaxHeight = windowHeight - tableTop - 40; // 40px for some bottom padding
        setTableMaxHeight(Math.max(newMaxHeight, 400)); // Ensure a minimum height of 400px
      }
    };

    updateTableHeight();
    window.addEventListener('resize', updateTableHeight);

    return () => {
      window.removeEventListener('resize', updateTableHeight);
    };
  }, []);

  const resetForm = () => {
    setObjectType(null);
    setSelectedCustomObject(null);
    setFileContents(null);
    setHubspotImportObject(null);
    setStandardObjectGroups([]);
    const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const parseFileContents = (headers: string[], rows: string[][]) => {
    if (!headers || !rows || headers.length === 0 || rows.length === 0) {
      setFileContents(null);
      return;
    }

    const excludedColumns = [
      'deleted', 'hubspot defined', 'created user', 'usages',
      'read only value', 'read only definition', 'calculated', 'external options'
    ];
    const filteredHeadersIndexes = headers.map((header, index) =>
      header && !excludedColumns.includes(header.toLowerCase()) ? index : -1
    ).filter(index => index !== -1);

    const filteredHeaders = filteredHeadersIndexes.map(index => headers[index]);
    let filteredRows = rows.map(row => filteredHeadersIndexes.map(index => row[index] || ''));

    // Add "Field Type" column if it doesn't exist
    const typeIndex = filteredHeaders.findIndex(header => header && header.toLowerCase() === 'type');
    const fieldTypeIndex = filteredHeaders.findIndex(header => header && header.toLowerCase() === 'field type');
    if (fieldTypeIndex === -1 && typeIndex !== -1) {
      filteredHeaders.splice(typeIndex + 1, 0, 'Field Type');
      filteredRows = filteredRows.map(row => {
        const fieldType = getFieldType(row[typeIndex]);
        const newRow = [...row];
        newRow.splice(typeIndex + 1, 0, fieldType);
        return newRow;
      });
    }

    // Add "Hidden" column if it doesn't exist
    const hiddenIndex = filteredHeaders.findIndex(header => header && header.toLowerCase() === 'hidden');
    if (hiddenIndex === -1) {
      filteredHeaders.push('Hidden');
      filteredRows = filteredRows.map(row => [...row, 'false']);
    }

    // Filter out default properties if checkbox is checked
    const hubspotDefinedIndex = headers.findIndex(header => header && header.toLowerCase() === 'hubspot defined');
    if (hubspotDefinedIndex !== -1 && excludeDefaultProperties) {
      filteredRows = filteredRows.filter((_, index) => rows[index][hubspotDefinedIndex]?.toLowerCase() !== 'true');
    }

    setFileContents({ headers: filteredHeaders, rows: filteredRows });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          if (results.data && Array.isArray(results.data) && results.data.length > 1) {
            const allHeaders = results.data[0] as string[];
            let allRows = results.data.slice(1) as string[][];

            // Remove empty rows
            allRows = allRows.filter(row => row.some(cell => cell && cell.trim() !== ''));

            parseFileContents(allHeaders, allRows);
          } else {
            console.error('Invalid CSV format');
            toast({
              title: "Error",
              description: "Invalid CSV format. Please check the file and try again.",
              variant: "destructive",
            });
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          toast({
            title: "Error",
            description: "Failed to parse the CSV file. Please check the file format and try again.",
            variant: "destructive",
          });
        },
        header: false,
        skipEmptyLines: true,
      });
    }
  }

  const handleExcludeDefaultPropertiesChange = (checked: boolean) => {
    setExcludeDefaultProperties(checked);
    if (fileContents && fileContents.headers && fileContents.rows) {
      parseFileContents(fileContents.headers, fileContents.rows);
    }
  };

  const handleDeleteRow = (index: number) => {
    if (fileContents) {
      const newRows = [...fileContents.rows];
      newRows.splice(index, 1);
      setFileContents({ ...fileContents, rows: newRows });
    }
  };

  const handleCloneRow = (index: number) => {
    if (fileContents) {
      const newRows = [...fileContents.rows];
      const clonedRow = [...newRows[index]];
      newRows.splice(index + 1, 0, clonedRow);
      setFileContents({ ...fileContents, rows: newRows });
    }
  };

  const handleFieldTypeChange = (rowIndex: number, newFieldType: string) => {
    if (fileContents) {
      const newRows = [...fileContents.rows];
      const fieldTypeIndex = fileContents.headers.findIndex(header => header.toLowerCase() === 'field type');
      if (fieldTypeIndex !== -1) {
        newRows[rowIndex][fieldTypeIndex] = newFieldType;
      } else {
        const typeIndex = fileContents.headers.findIndex(header => header.toLowerCase() === 'type');
        if (typeIndex !== -1) {
          newRows[rowIndex].splice(typeIndex + 1, 1, newFieldType);
        }
      }
      setFileContents({ ...fileContents, rows: newRows });
    }
  };

  const handleTypeChange = (rowIndex: number, newType: string) => {
    if (fileContents) {
      const newRows = [...fileContents.rows];
      const typeIndex = fileContents.headers.findIndex(header => header.toLowerCase() === 'type');
      if (typeIndex !== -1) {
        newRows[rowIndex][typeIndex] = newType;
        // Update the Field Type based on the new Type
        const fieldTypeIndex = fileContents.headers.findIndex(header => header.toLowerCase() === 'field type');
        if (fieldTypeIndex !== -1) {
          newRows[rowIndex][fieldTypeIndex] = getFieldType(newType);
        }
      }
      setFileContents({ ...fileContents, rows: newRows });
    }
  };

  const handleCellChange = (rowIndex: number, columnIndex: number, newValue: string | boolean) => {
    if (fileContents) {
      const newRows = [...fileContents.rows];
      newRows[rowIndex][columnIndex] = newValue.toString();
      setFileContents({ ...fileContents, rows: newRows });
    }
  };

  const handleOptionsChange = (rowIndex: number, newOptions: HubspotProperty['options']) => {
    if (fileContents) {
      const newRows = [...fileContents.rows];
      const optionsIndex = fileContents.headers.findIndex(header => header.toLowerCase() === 'options');
      if (optionsIndex !== -1) {
        newRows[rowIndex][optionsIndex] = JSON.stringify(newOptions);
        setFileContents({ ...fileContents, rows: newRows });
      }
    }
  };

  const createHubspotImportObject = () => {
    if (!fileContents) return;

    const headerMap: { [key: string]: number } = {};
    fileContents.headers.forEach((header, index) => {
      headerMap[header.toLowerCase()] = index;
    });

    const inputs: HubspotProperty[] = fileContents.rows.map((row) => {
      const type = row[headerMap['type']]?.toLowerCase() as HubspotProperty['type'] || 'string';
      const fieldType = row[headerMap['field type']] as HubspotProperty['fieldType'] || getFieldType(type);

      const property: HubspotProperty = {
        name: row[headerMap['internal name']] || '',
        label: row[headerMap['name']] || '',
        description: row[headerMap['description']] || '',
        groupName: row[headerMap['group name']] || 'contactinformation',
        type: type,
        fieldType: fieldType,
        hidden: row[headerMap['hidden']]?.toLowerCase() === 'true',
        displayOrder: parseInt(row[headerMap['display order']] || '0', 10),
        formField: row[headerMap['form field']]?.toLowerCase() !== 'false', // Default to true if not set
        hasUniqueValue: false,
      };

      if (type === 'bool' || type === 'boolean') {
        property.options = [
          { label: 'Yes', value: 'true', displayOrder: 1, hidden: false, readonly: false },
          { label: 'No', value: 'false', displayOrder: 2, hidden: false, readonly: false }
        ];
      }

      if (type === 'enumeration') {
        const optionsCell = row[headerMap['options']];
        if (optionsCell) {
          try {
            const parsedOptions = JSON.parse(optionsCell);
            if (Array.isArray(parsedOptions)) {
              property.options = parsedOptions.map((option, index) => ({
                label: option.label || '',
                value: option.value || '',
                displayOrder: option.displayOrder || index,
                hidden: option.hidden || false,
                readonly: option.readonly || false
              }));
            }
          } catch (e) {
            console.error('Error parsing options:', e);
            property.options = [];
          }
        }
      }

      return property;
    });

    setHubspotImportObject({ inputs });
  };

  const uploadToHubspot = async () => {
    if (!hubspotImportObject || (!objectType && !selectedCustomObject)) {
      toast({
        title: "Error",
        description: "Please generate the Hubspot Import Object first and ensure an object type is selected.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const actualObjectType = objectType === 'custom' ? selectedCustomObject : objectType;
      const response = await fetch(`/api/hubspot-upload?objectType=${actualObjectType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hubspotImportObject.inputs),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload properties to HubSpot');
      }

      setSuccessMessage(JSON.stringify(result, null, 2));
      const successDescription = [
        `Uploaded ${result.numPropertiesCreated} ${result.numPropertiesCreated === 1 ? 'property' : 'properties'} to HubSpot.`,
        result.numErrors > 0 && `Failed to upload ${result.numErrors} ${result.numErrors === 1 ? 'property' : 'properties'}.`,
        result.errorMessages?.length > 0 && `Errors: ${result.errorMessages.join(', ')}`
      ].filter(Boolean).join('\n');

      toast({
        title: "Successful request",
        description: successDescription,
      });
      console.log(successDescription);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while uploading to HubSpot.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Error uploading to HubSpot:', errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const fetchCustomObjects = async () => {
    setIsLoadingCustomObjects(true);
    setCustomObjectsError(null);

    try {
      const response = await fetch('/api/hubspot-schemas');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (!data.results || data.results.length === 0) {
        setCustomObjectsError('No custom objects found');
        setCustomObjects([]);
      } else {
        const objects = data.results
          .filter((schema: any) => schema.objectTypeId.startsWith('2-'))
          .map((schema: any) => ({
            name: schema.name,
            objectTypeId: schema.objectTypeId,
            groupNames: [...new Set(schema.properties.map((prop: any) => prop.groupName))]
          }));

        setCustomObjects(objects);
      }
    } catch (error) {
      console.error('Error fetching custom objects:', error);
      setCustomObjectsError(error instanceof Error ? error.message : 'Failed to fetch custom objects');
    } finally {
      setIsLoadingCustomObjects(false);
    }
  };

  const fetchStandardObjectGroups = async (objectType: string) => {
    setIsLoadingCustomObjects(true);
    setCustomObjectsError(null);

    try {
      const response = await fetch(`/api/hubspot-property-groups?objectType=${objectType}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (!data.results || data.results.length === 0) {
        setCustomObjectsError('No groups found');
        setStandardObjectGroups([]);
      } else {
        const groups = data.results.map((group: any) => group.name);
        setStandardObjectGroups(groups);
      }
    } catch (error) {
      console.error(`Error fetching groups for ${objectType}:`, error);
      setCustomObjectsError(error instanceof Error ? error.message : `Failed to fetch groups for ${objectType}`);
    } finally {
      setIsLoadingCustomObjects(false);
    }
  };

  useEffect(() => {
    if (objectType === 'custom') {
      fetchCustomObjects();
    } else if (objectType) {
      fetchStandardObjectGroups(objectType);
    } else {
      setCustomObjects([]);
      setStandardObjectGroups([]);
      setCustomObjectsError(null);
    }
  }, [objectType]);

  useEffect(() => {
    if (selectedCustomObject) {
      const selectedObject = customObjects.find(obj => obj.objectTypeId === selectedCustomObject);
      if (selectedObject) {
        setStandardObjectGroups(selectedObject.groupNames);
      }
    }
  }, [selectedCustomObject, customObjects]);


  return (
    <div className="container mx-auto px-4 py-12 h-screen overflow-hidden">
      <h1 className="text-4xl font-bold text-center mb-8">Upload Bulk Properties</h1>

      <div className="flex gap-4 mb-8">
        <Card className="flex-1 p-8">
          <form className="space-y-6">
            <div className="grid grid-cols-[auto,1fr] items-center gap-4">
              <label htmlFor="objectType" className="text-base">
                Select Object Type:
              </label>
              <div className="flex items-center gap-2">
                <Select
                  key={objectType === null ? 'reset' : 'selected'}
                  value={objectType || ''}
                  onValueChange={(value) => setObjectType(value)}
                  disabled={objectType !== null}
                >
                  <SelectTrigger id="objectType">
                    <SelectValue placeholder="Select object" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contacts">Contacts</SelectItem>
                    <SelectItem value="companies">Companies</SelectItem>
                    <SelectItem value="deals">Deals</SelectItem>
                    <SelectItem value="tickets">Tickets</SelectItem>
                    <SelectItem value="custom">Custom Objects</SelectItem>
                  </SelectContent>
                </Select>
                {objectType && (
                  <Button onClick={resetForm} variant="outline" size="sm">
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {objectType === 'custom' && (
              <div className="grid grid-cols-[auto,1fr] items-center gap-4">
                <label htmlFor="customObjectType" className="text-base">
                  Select Custom Object Type:
                </label>
                {isLoadingCustomObjects ? (
                  <div className="text-sm text-muted-foreground">Loading custom objects...</div>
                ) : customObjectsError ? (
                  <div className="text-sm text-red-500">
                    Error: {customObjectsError}
                    <br />
                    Please check your HubSpot API key and permissions.
                  </div>
                ) : (
                  <Select onValueChange={(value) => setSelectedCustomObject(value)}>
                    <SelectTrigger id="customObjectType">
                      <SelectValue placeholder="Select custom object" />
                    </SelectTrigger>
                    <SelectContent>
                      {customObjects.map((obj) => (
                        <SelectItem key={obj.objectTypeId} value={obj.objectTypeId}>
                          {obj.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="grid grid-cols-[auto,1fr] items-center gap-4">
              <label htmlFor="fileUpload" className="text-base">
                File Upload:
              </label>
              <div className="flex items-center gap-4">
                <input
                  key={objectType || 'initial'}
                  type="file"
                  id="fileUpload"
                  onChange={handleFileChange}
                  accept=".csv"
                  disabled={!objectType}
                  className={`file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 ${
                    !objectType ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                {!objectType && (
                  <span className="text-sm text-gray-500">Select an object type first</span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="excludeDefaultProperties"
                checked={excludeDefaultProperties}
                onCheckedChange={handleExcludeDefaultPropertiesChange}
              />
              <label
                htmlFor="excludeDefaultProperties"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Don't include default properties
              </label>
            </div>
          </form>
        </Card>

        <Card className="flex-1 p-8">
          <div className="space-y-4 font-bold text-black">
            <div className="flex items-center mb-4">
              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </PopoverTrigger>
                  <PopoverContent>
                    Download an example CSV file with pre-filled data to view the expected headers. This file matches the format HubSpot uses when exporting all properties from the property settings page : https://app.hubspot.com/property-settings/accountID/properties.
                  </PopoverContent>
                </Popover>
                <Link href="https://docs.google.com/spreadsheets/d/15vedqAQM4bZ3soLgxigbUs9goIJfWRYfYFWcOUr0qQY/edit?usp=sharing" className="text-black hover:underline">
                  Sample Upload Template
                </Link>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  createHubspotImportObject();
                  document.getElementById('viewHubspotImportObjectTrigger')?.click();
                }}
                className="flex-1 py-2 px-4 rounded-md"
                disabled={!fileContents}
              >
                Generate Hubspot Import Object
              </Button>
              <Button
                onClick={uploadToHubspot}
                className="flex-1 bg-[#FF5E34] hover:bg-[#FF5E34]/90 text-white font-bold py-2 px-4 rounded-md"
                disabled={!hubspotImportObject || isUploading || (objectType === 'custom' && !selectedCustomObject)}
              >
                {isUploading ? "Uploading..." : "Upload to HubSpot"}
              </Button>
            </div>
            {objectType && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Available Group Names:</h3>
                {isLoadingCustomObjects ? (
                  <div className="text-sm text-muted-foreground">Loading groups...</div>
                ) : customObjectsError ? (
                  <div className="text-sm text-red-500">
                    Error: {customObjectsError}
                    <br />
                    Please check your HubSpot API key and permissions.
                  </div>
                ) : objectType === 'custom' ? (
                  selectedCustomObject ? (
                    standardObjectGroups.length > 0 ? (
                      <div className="max-h-[90px] overflow-y-auto border rounded-md p-2">
                        <ul className="list-disc list-inside columns-2">
                          {standardObjectGroups.map((groupName, index) => (
                            <li key={index} className="font-normal">{groupName}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="font-normal">No group names found for this custom object.</p>
                    )
                  ) : (
                    <p className="font-normal">Please select a custom object to view its group names.</p>
                  )
                ) : standardObjectGroups.length > 0 ? (
                  <div className="max-h-[90px] overflow-y-auto border rounded-md p-2">
                    <ul className="list-disc list-inside columns-2">
                      {standardObjectGroups.map((groupName, index) => (
                        <li key={index} className="font-normal">{groupName}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p>No group names found for this object type.</p>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button id="viewHubspotImportObjectTrigger" className="hidden">View Hubspot Import Object</Button>
        </DialogTrigger>
        <DialogContent className="max-w-[800px] w-full">
          <DialogHeader>
            <DialogTitle>Hubspot Import Object</DialogTitle>
            <DialogDescription>
              This is the generated Hubspot Import Object based on your CSV file.
            </DialogDescription>
          </DialogHeader>
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto max-h-[60vh]">
            <code className="text-sm font-mono">
              {JSON.stringify(hubspotImportObject, null, 2)}
            </code>
          </pre>
        </DialogContent>
      </Dialog>

      {fileContents && (
        <div className="mt-8">
          <div className="flex items-center mb-4">
            <h2 className="text-2xl font-semibold">File Contents</h2>
          </div>

          {hubspotImportObject && (
            <div className="mb-8">
              {/* Dialog moved above */}
            </div>
          )}

          <div
            ref={tableContainerRef}
            className="w-full border border-gray-200 rounded-lg"
            style={{
              height: tableMaxHeight ? `${tableMaxHeight}px` : 'calc(100vh - 600px)',
              minHeight: '400px',
              display: 'block',
              overflowX: 'scroll',
              overflowY: 'scroll',
              position: 'relative'
            }}
          >
            <FileContentsTable
              headers={fileContents.headers}
              rows={fileContents.rows}
              onDeleteRow={handleDeleteRow}
              onCloneRow={handleCloneRow}
              onFieldTypeChange={handleFieldTypeChange}
              onTypeChange={handleTypeChange}
              onCellChange={handleCellChange}
              onOptionsChange={handleOptionsChange}
            />
          </div>
        </div>
      )}

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
      return 'booleancheckbox';
    case 'enumeration':
      return 'select';
    default:
      return 'text';
  }
}
