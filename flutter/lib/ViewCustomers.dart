import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'NetworkHandler.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'UpdateCustomer.dart';

class ViewCustomers extends StatefulWidget {
  @override
  _ViewCustomersState createState() => _ViewCustomersState();
}

class _ViewCustomersState extends State<ViewCustomers> {
  List _customersForDisplay = [];
  final storage = new FlutterSecureStorage();
  NetworkHandler networkHandler = NetworkHandler();
  var response;
  List Customers = [];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: Text('View Customers '),
        ),
        body: ListView.builder(
          itemBuilder: (context, index) {
            return index == 0
                ? Padding(
                    padding: EdgeInsets.all(16.0),
                    child: TextField(
                      decoration: InputDecoration(hintText: 'Search...'),
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
                    ))
                : _listItem(index - 1);
          },
          itemCount: Customers.length + 1,
        ));
  }

  _listItem(index) {
    return GestureDetector(
        onTap: () {
          Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (context) => UpdateCustomer(
                      Customers[index]["id"],
                      Customers[index]["name"],
                      Customers[index]["phone"].toString())));
        },
        child: Card(
            child: ListTile(
          title: Text(Customers[index]["name"]),
          subtitle: Text(Customers[index]["phone"].toString()),
        )));
  }
}
