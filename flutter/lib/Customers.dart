import 'package:flutter/material.dart';

import 'AddNewCustomer.dart';
import 'ViewCustomers.dart';

class Customers extends StatefulWidget {
  @override
  _CustomersState createState() => _CustomersState();
}

class _CustomersState extends State<Customers> {
  @override
  Widget build(BuildContext context) {
    return SafeArea(
        child: Scaffold(
            appBar: AppBar(
              title: Text("Customers"),
            ),
            body: Container(
              padding: EdgeInsets.all(12.0),
              child: Center(
                child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      new GestureDetector(
                        onTap: () {
                          Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (context) => ViewCustomers()));
                        },
                        child: Card(
                          child: Padding(
                            padding: EdgeInsets.only(top: 5.0, bottom: 5.0),
                            child: new ListTile(
                              title: new Text(
                                "View Customer",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                        ),
                      ),
                      SizedBox(height: 10.0),
                      new GestureDetector(
                        onTap: () {
                          Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (context) => AddNewCustomer()));
                        },
                        child: Card(
                          child: Padding(
                            padding: EdgeInsets.only(top: 5.0, bottom: 5.0),
                            child: new ListTile(
                              title: new Text(
                                "Add New Customers",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ]),
              ),
            )));
  }
}
