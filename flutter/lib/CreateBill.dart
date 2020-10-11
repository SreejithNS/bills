import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'HomePage.dart';
import 'NetworkHandler.dart';
import 'package:http/http.dart' as http;

class CreateBill extends StatefulWidget {
  @override
  _CreateBillState createState() => _CreateBillState();
}

class _CreateBillState extends State<CreateBill> {
  final _globalkey = GlobalKey<FormState>();
  final storage = new FlutterSecureStorage();
  int count = 1;
  bool circular = false;
  List _customersForDisplay = [];
  NetworkHandler networkHandler = NetworkHandler();
//  List<String> _locations = ['jeevanvarma', 'sreejith', 'sayantan', 'mohit'];
//  String _selectedLocation;
  TextEditingController _customeridController = TextEditingController();
  TextEditingController _discountController = TextEditingController();
  List Customers = [];
  final List<Widget> Products = [];
  final List<TextEditingController> _itemcodeController = [];
  final List<TextEditingController> _quantityController = [];

  @override
  void initState() {
    super.initState();
    _itemcodeController.add(TextEditingController());
    _quantityController.add(TextEditingController());
    Products.add(InputWidget(_itemcodeController[0], _quantityController[0]));
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
        child: Scaffold(
            appBar: new AppBar(title: Text("Create Bill")),
            body: SingleChildScrollView(
                child: Form(
                    key: _globalkey,
                    child: Column(children: [
                      SizedBox(
                        height: 5.0,
                      ),
                      Padding(
                        padding: EdgeInsets.all(16.0),
                        child: TextFormField(
                          onChanged: (text) {
                            text = text.toLowerCase();
                            if (text == "") {
                              Customers = [];
                            } else {
                              setState(() async {
                                String token = await storage.read(key: "token");
                                var res = await http.get(
                                    "http://sreejith-5a562523.localhost.run/api/customer/suggestions/$text",
                                    headers: {
                                      "Content-type": "application/json",
                                      "Authorization": "Bearer $token"
                                    });
                                print(res.statusCode);
                                var resBody = json.decode(res.body);
                                print(resBody["data"]);
                                print(resBody["message"]);
                                _customersForDisplay.addAll(resBody["data"]);
                                setState(() {
                                  Customers = _customersForDisplay;
                                  _customersForDisplay = [];
                                });
                              });
                            }
                          },
                          controller: _customeridController,
                          decoration:
                              InputDecoration(hintText: 'Select Customer'),
                          validator: (value) {
                            if (value.isEmpty)
                              return "Customer id can't be empty";
                            return null;
                          },
                        ),
                      ),
//                      Center(
//                        child: DropdownButton(
//                          hint: Text('Please choose a Customer'),
//                          value: _selectedLocation,
//                          onChanged: (newValue) {
//                            setState(() {
//                              _selectedLocation = newValue;
//                            });
//                          },
//                          items: _locations.map((location) {
//                            return DropdownMenuItem(
//                              child: new Text(location),
//                              value: location,
//                            );
//                          }).toList(),
//                        ),
//                      ),
                      SizedBox(
                        height: 10.0,
                      ),
                      Column(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: Products),
                      SizedBox(
                        height: 10.0,
                      ),
                      Padding(
                        padding: EdgeInsets.all(16.0),
                        child: TextFormField(
                          inputFormatters: [
                            WhitelistingTextInputFormatter.digitsOnly
                          ],
                          controller: _discountController,
                          decoration:
                              InputDecoration(hintText: 'Discount Amount'),
                        ),
                      ),
                      InkWell(
                        onTap: () async {
                          setState(() {
                            circular = true;
                          });
                          print(count);
                          var data = json.encode({
                            "customerId": "5f81b8159313a917f52ba2b8",
//                            _customeridController.text,
                            "items": [
                              for (int x = 0; x < count; x++)
                                {
                                  "item": _itemcodeController[x].text,
                                  "quantity": _quantityController[x].text,
                                },
                            ],
                            "discountAmount": _discountController.text,
                          });
                          print(data);
                          if (_globalkey.currentState.validate()) {
                            String token = await storage.read(key: "token");
                            var response = await http.post(
                              "http://sreejith-5a562523.localhost.run/api/bill",
                              headers: {"Authorization": "Bearer $token"},
                              body: json.encode({
                                "customerId": _customeridController.text,
                                "items": [
                                  for (int x = 0; x < count; x++)
                                    {
                                      "item": _itemcodeController[x].text,
                                      "quantity": _quantityController[x].text,
                                    },
                                ],
                                if (_discountController.text != "")
                                  "discountAmount": _discountController.text,
                                if (_discountController.text == "")
                                  "discountAmount": "0",
                              }),
                            );

                            print(response.statusCode);

                            Map<String, dynamic> output =
                                json.decode(response.body);
                            print(output["message"]);
                            print(output["data"]);
                            if (response.statusCode == 200 ||
                                response.statusCode == 201) {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => HomePage(),
                                ),
                              );
                            } else {
                              setState(() {
                                circular = false;
                                showDialog(
                                  context: context,
                                  builder: (_) => AlertDialog(
                                      title:
                                          Text('Bill Generated successfully'),
                                      actions: <Widget>[
                                        RaisedButton(
                                          onPressed: () {
                                            Navigator.pushAndRemoveUntil(
                                                context,
                                                MaterialPageRoute(
                                                  builder: (context) =>
                                                      HomePage(),
                                                ),
                                                (route) => false);
                                          },
                                          child: Text("ok"),
                                        )
                                      ]),
                                  barrierDismissible: true,
                                );
                              });
                            }
                          } else {
                            setState(() {
                              circular = false;
                              showDialog(
                                context: context,
                                builder: (_) => AlertDialog(
                                    title: Text('Bill Generated successfully'),
                                    actions: <Widget>[
                                      RaisedButton(
                                        onPressed: () {
                                          Navigator.pushAndRemoveUntil(
                                              context,
                                              MaterialPageRoute(
                                                builder: (context) =>
                                                    HomePage(),
                                              ),
                                              (route) => false);
                                        },
                                        child: Text("ok"),
                                      )
                                    ]),
                                barrierDismissible: true,
                              );
                            });
                          }
                        },
                        child: circular
                            ? CircularProgressIndicator()
                            : Container(
                                width: 150,
                                height: 50,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(10),
                                  color: Color(0xff00A86B),
                                ),
                                child: Center(
                                  child: Text(
                                    "Generate Bill",
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                      ),
                      SizedBox(
                        height: 15.0,
                      ),
                    ]))),
            floatingActionButton: new FloatingActionButton(
              child: new Icon(Icons.add),
              onPressed: () {
                setState(() {
                  count = count + 1;
                  _itemcodeController.add(TextEditingController());
                  _quantityController.add(TextEditingController());
                  Products.add(InputWidget(_itemcodeController[count - 1],
                      _quantityController[count - 1]));
                });
              },
            )));
  }
}

class InputWidget extends StatefulWidget {
  final TextEditingController _itemcodeController;
  final TextEditingController _quantityController;
  InputWidget(this._itemcodeController, this._quantityController);
  @override
  _InputWidgetState createState() =>
      _InputWidgetState(this._itemcodeController, this._quantityController);
}

class _InputWidgetState extends State<InputWidget> {
  final TextEditingController _itemcodeController;
  final TextEditingController _quantityController;

  _InputWidgetState(this._itemcodeController, this._quantityController);
//  List<String> _locations = [
//    'oero',
//    'lays',
//    'colgate',
//    'Chat masala',
//    'nescafe coffee'
//  ];
//  String _selectedLocation;

  @override
  Widget build(BuildContext context) {
    return new Form(
        child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 10.0),
            child: Card(
              color: Colors.grey[200],
              clipBehavior: Clip.antiAlias,
              child: Column(
                children: [
                  ListTile(
                    title: const Text("Name of the product:"),
                    subtitle: Text(
                      "MPR:",
                      style: TextStyle(color: Colors.black.withOpacity(0.6)),
                    ),
                  ),
                  Padding(
                      padding: const EdgeInsets.only(
                          left: 16.0, right: 16.0, bottom: 16.0),
                      child: Column(children: [
                        TextFormField(
                          controller: _itemcodeController,
                          decoration: InputDecoration(
                            labelText: 'Item Code',
                          ),
                        ),
//                        Center(
//                          child: DropdownButton(
//                            hint: Text(
//                                'Please choose a Product'), // Not necessary for Option 1
//                            value: _selectedLocation,
//                            onChanged: (newValue) {
//                              setState(() {
//                                _selectedLocation = newValue;
//                              });
//                            },
//                            items: _locations.map((location) {
//                              return DropdownMenuItem(
//                                child: new Text(location),
//                                value: location,
//                              );
//                            }).toList(),
//                          ),
//                        ),
                        TextFormField(
                          inputFormatters: [
                            WhitelistingTextInputFormatter.digitsOnly
                          ],
                          controller: _quantityController,
                          decoration: InputDecoration(
                            labelText: 'Quantity',
                          ),
                        ),
                      ])),
                ],
              ),
            )));
  }
}
