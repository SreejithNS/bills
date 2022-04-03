export default function formDatatoJSON(form: EventTarget & HTMLFormElement) {
    let obj: Record<string, any> = {};
    let elements = (form.elements as unknown) as HTMLInputElement[];
    for (let element of Array.from(elements)) {
        let name = element.name;
        let value = element.value;
        if (name) {
            if (!isNaN(value as any) && value.toString().indexOf('.') !== -1)
                obj[name] = (value as any) * 1;
            else obj[name] = value;
        }
    }
    return obj;
}
