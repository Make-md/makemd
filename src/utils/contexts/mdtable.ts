import { DBRows, MDBField } from "types/mdb";


export const createTable = (object: DBRows, columns: MDBField[]) => {

    const columnNames = columns.map(f => f.name)
    const base = '|';
    let outputString = base + columnNames.join(base) + '|\n';

    columns.forEach(f => {
        outputString += base + '----';
    })
    outputString += base + '\n';
    object.forEach((row) => {
        outputString += columnNames.map(c => base + row[c]).join('') + '|\n';
    });

    return outputString;
}
