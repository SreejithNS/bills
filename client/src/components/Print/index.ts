/// <reference types="web-bluetooth" />
import { BillData } from './../../reducers/bill.reducer';
import BillText from "./BillText";

type PrintBillData = Pick<BillData, "customer" | "soldBy" | "serialNumber" | "createdAt" | "billAmount" | "discountAmount" | "itemsTotalAmount" | "items">;

export default class Print {
  private printBuffer: number[] = [];
  private printLines: string[] = [];

  public static unsupportedError = () => new Error("Bluetooth not Support. Please update Chrome to use Bluetooth");

  public static instance: Print | null = null;

  public static onConnect: () => any;
  public static onDisconnect: () => any;

  constructor(public printer: BluetoothRemoteGATTCharacteristic, private pageWidth: number = 42) { }

  public static async init() {
    if (Print.instance) return Print.instance;

    if ("bluetooth" in navigator) {
      try {
        const device = await navigator.bluetooth
          .requestDevice({
            acceptAllDevices: true,
            optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb"] // Required to access service later.
          });

        //Connect to Bluetooth GATT Server
        if (!device.gatt) return Promise.reject(this.unsupportedError());

        const server = await device.gatt.connect();
        if (Print.onConnect) Print.onConnect();

        device.ongattserverdisconnected = ((_) => {
          if (Print.onDisconnect) Print.onDisconnect();
          Print.instance = null;
        })

        //Get Primary Service & Characteristics
        const service = await server.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
        const characteristic = await service.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb");

        Print.instance = new Print(characteristic);

        return Print.instance;
      } catch (e) {
        return Promise.reject(e);
      }
    } else {
      return Promise.reject(this.unsupportedError());
    }
  }

  private async print(arr: Uint8Array, n: number = 100) {
    const printer = (await Print.init()).printer;

    let i = 0;
    while (true) {
      const data = arr.slice(i, i + n);
      if (data.length === 0) break;
      await printer.writeValue(data);
      i += n;
    }
    return true;
  }

  public async printBill({ customer, soldBy, itemsTotalAmount, serialNumber, createdAt, billAmount, discountAmount, items }: PrintBillData) {
    try {
      const itemString = items.map(item => {
        return [item.name, item.quantity.toString() + (item.unit || ""), (item.quantity * item.rate).toString()]
      })

      const billText = new BillText(
        customer.name, serialNumber, (new Date(createdAt)).toDateString(), soldBy.name,
        itemString, billAmount, itemsTotalAmount, discountAmount || undefined
      );

      try {
        await this.print(billText.toPrintBuffer());
        return Promise.resolve();
      } catch (e) {
        console.error(e);
        return Promise.reject(new Error("Print Error."))
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }
}