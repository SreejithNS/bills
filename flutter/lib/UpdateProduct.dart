import 'package:bills/Inventory.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';
import 'HomePage.dart';
import 'NetworkHandler.dart';

class UpdateProduct extends StatefulWidget {
  final String code;
  final String name;
  final String mrp;
  final String rate;
  final String id;

  UpdateProduct(this.code, this.name, this.mrp, this.rate, this.id);

  @override
  _UpdateProductState createState() =>
      _UpdateProductState(code, name, mrp, rate, id);
}

class _UpdateProductState extends State<UpdateProduct> {
  final String code;
  final String name;
  final String mrp;
  final String rate;
  final String id;

  _UpdateProductState(this.code, this.name, this.mrp, this.rate, this.id);

  final _globalkey = GlobalKey<FormState>();
  NetworkHandler networkHandler = NetworkHandler();
  final storage = new FlutterSecureStorage();
  bool circular = false;
  bool circular1 = false;
  TextEditingController _codeController;
  TextEditingController _nameController;
  TextEditingController _mrpController;
  TextEditingController _rateController;

  @override
  void initState() {
    super.initState();
    _codeController = new TextEditingController(text: code);
    _nameController = new TextEditingController(text: name);
    _mrpController = new TextEditingController(text: mrp);
    _rateController = new TextEditingController(text: rate);
    print(name);
    print(code);
    print(mrp);
    print(rate);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: Text("Update Product"),
        ),
        body: Form(
            key: _globalkey,
            child: Container(
                child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                nameTextField(),
                codeTextField(),
                mrpTextField(),
                rateTextField(),
                SizedBox(
                  height: 10,
                ),
                InkWell(
                  onTap: () async {
                    setState(() {
                      circular = true;
                    });
                    if (_globalkey.currentState.validate()) {
                      Map<String, String> data = {
                        "code": _codeController.text,
                        "name": _nameController.text,
                        "mrp": _mrpController.text,
                        "rate": _rateController.text,
                      };
                      print(data);
                      var response =
                          await networkHandler.put("/product/$id", data);

                      print(response.statusCode);

                      Map<String, dynamic> output = json.decode(response.body);
                      print(output["message"]);
                      print(output["data"]);
                      setState(() {
                        circular = false;
                      });
                      if (response.statusCode == 200 ||
                          response.statusCode == 201) {
                        circular = false;
                        showDialog(
                          context: context,
                          builder: (_) => AlertDialog(
                              title: Text('Product Updated successfully'),
                              actions: <Widget>[
                                RaisedButton(
                                  onPressed: () {
                                    Navigator.pushAndRemoveUntil(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => HomePage(),
                                        ),
                                        (route) => false);
                                  },
                                  child: Text("ok"),
                                )
                              ]),
                          barrierDismissible: true,
                        );
                      } else {
                        setState(() {
                          circular = false;
                        });
                      }
                    } else {
                      setState(() {
                        circular = false;
                        showDialog(
                          context: context,
                          builder: (_) => AlertDialog(
                              title: Text('Error'),
                              actions: <Widget>[
                                RaisedButton(
                                  onPressed: () {
                                    Navigator.of(context).pop();
                                  },
                                  child: Text("ok"),
                                )
                              ]),
                          barrierDismissible: false,
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
                              "Update",
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
                  height: 10,
                ),
                InkWell(
                  onTap: () async {
                    setState(() {
                      circular1 = true;
                    });

                    var response = await networkHandler.delete("/product/$id");

                    print(response.statusCode);

                    Map<String, dynamic> output = json.decode(response.body);
                    print(output["message"]);
                    print(output["data"]);
                    setState(() {
                      circular1 = false;
                    });
                    if (response.statusCode == 200 ||
                        response.statusCode == 201) {
                      circular1 = false;
                      showDialog(
                        context: context,
                        builder: (_) => AlertDialog(
                            title: Text('Product Deleted successfully'),
                            actions: <Widget>[
                              RaisedButton(
                                onPressed: () {
                                  Navigator.pushAndRemoveUntil(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => HomePage(),
                                      ),
                                      (route) => false);
                                },
                                child: Text("ok"),
                              )
                            ]),
                        barrierDismissible: true,
                      );
                    } else {
                      setState(() {
                        circular1 = false;
                        showDialog(
                          context: context,
                          builder: (_) => AlertDialog(
                              title: Text('Error'),
                              actions: <Widget>[
                                RaisedButton(
                                  onPressed: () {
                                    Navigator.of(context).pop();
                                  },
                                  child: Text("ok"),
                                )
                              ]),
                          barrierDismissible: false,
                        );
                      });
                    }
                  },
                  child: circular1
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
                              "Delete",
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                ),
              ],
            ))));
  }

  Widget nameTextField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
      child: Column(
        children: [
          Text("Name"),
          TextFormField(
            onChanged: (text) {
              _nameController.text = text;
            },
            validator: (value) {
              if (value.isEmpty) return "Name can't be empty";
              return null;
            },
            controller: _nameController,
            decoration: InputDecoration(
              focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(
                  color: Colors.black,
                  width: 2,
                ),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget codeTextField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
      child: Column(
        children: [
          Text("Code"),
          TextFormField(
            onChanged: (text) {
              _codeController.text = text;
            },
            controller: _codeController,
            validator: (value) {
              if (value.isEmpty) return "Code can't be empty";
              return null;
            },
            decoration: InputDecoration(
              focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(
                  color: Colors.black,
                  width: 2,
                ),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget mrpTextField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
      child: Column(
        children: [
          Text("MRP"),
          TextFormField(
            onChanged: (text) {
              _mrpController.text = text;
            },
            inputFormatters: [WhitelistingTextInputFormatter.digitsOnly],
            controller: _mrpController,
            validator: (value) {
              if (value.isEmpty) return "MRP can't be empty";
              return null;
            },
            decoration: InputDecoration(
              focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(
                  color: Colors.black,
                  width: 2,
                ),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget rateTextField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10.0),
      child: Column(
        children: [
          Text("Rate"),
          TextFormField(
            onChanged: (text) {
              _rateController.text = text;
            },
            inputFormatters: [WhitelistingTextInputFormatter.digitsOnly],
            controller: _rateController,
            validator: (value) {
              if (value.isEmpty) return "Rate can't be empty";
              return null;
            },
            decoration: InputDecoration(
              focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(
                  color: Colors.black,
                  width: 2,
                ),
              ),
            ),
          )
        ],
      ),
    );
  }
}
